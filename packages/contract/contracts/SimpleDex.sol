// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDEX
 * @dev Simple mini DEX with AMM (Automated Market Maker)
 * Uses the x * y = k formula (constant product)
 */
contract SimpleDEX is ERC20, ReentrancyGuard, Ownable {
    // Tokens being traded
    IERC20 public immutable tokenA; // SEED Token
    IERC20 public immutable tokenB; // Mock USDC

    // Reserves (token reserve in pool)
    uint256 public reserveA;
    uint256 public reserveB;

    // Fee for each swap (0.3%)
    uint256 public constant FEE_PERCENT = 3;      // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000; // 100%

    // Minimum liquidity to prevent division by zero
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    
    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        address indexed user,
        uint256 amountAIn,
        uint256 amountBIn,
        uint256 amountAOut,
        uint256 amountBOut
    );
    
    constructor(address _tokenA, address _tokenB) 
        ERC20("SimpleDEX LP", "SDEX-LP") 
        Ownable(msg.sender)
    {
        require(_tokenA != _tokenB, "Identical tokens");
        require(_tokenA != address(0) && _tokenB != address(0), "Zero address");
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev Add liquidity to pool
     * @param amountA Amount of token A to be added
     * @param amountB Amount of token B to be added
     * @return liquidity Amount of LP tokens received
     */
    function addLiquidity(uint256 amountA, uint256 amountB) 
        external 
        nonReentrant 
        returns (uint256 liquidity) 
    {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        // Transfer tokens from user
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        uint256 totalLiquidity = totalSupply();

        if (totalLiquidity == 0) {
            // First pool - set initial price
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY); // Lock minimum liquidity to dead address
        } else {
            // Pool already exists - maintain price ratio
            liquidity = min(
                (amountA * totalLiquidity) / reserveA,
                (amountB * totalLiquidity) / reserveB
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");

        // Mint LP tokens to user
        _mint(msg.sender, liquidity);

        // Update reserves
        reserveA += amountA;
        reserveB += amountB;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Remove liquidity from pool
     * @param liquidity Amount of LP tokens to burn
     * @return amountA Amount of token A received
     * @return amountB Amount of token B received
     */
    function removeLiquidity(uint256 liquidity) 
        external 
        nonReentrant 
        returns (uint256 amountA, uint256 amountB) 
    {
        require(liquidity > 0, "Liquidity must be greater than 0");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP tokens");

        uint256 totalLiquidity = totalSupply();

        // Calculate token amounts based on proportion
        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        // Burn LP tokens
        _burn(msg.sender, liquidity);

        // Transfer tokens to user
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Swap token A for token B
     * @param amountAIn Amount of token A to swap
     * @param minAmountBOut Minimum token B expected (slippage protection)
     */
    function swapAforB(uint256 amountAIn, uint256 minAmountBOut) 
        external 
        nonReentrant 
    {
        require(amountAIn > 0, "Amount must be greater than 0");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");

        // Calculate output amount using AMM formula
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut >= minAmountBOut, "Slippage too high");

        // Transfer input token from user
        tokenA.transferFrom(msg.sender, address(this), amountAIn);

        // Transfer output token to user
        tokenB.transfer(msg.sender, amountBOut);

        // Update reserves
        reserveA += amountAIn;
        reserveB -= amountBOut;
        
        emit Swap(msg.sender, amountAIn, 0, 0, amountBOut);
    }
    
    /**
     * @dev Swap token B for token A
     * @param amountBIn Amount of token B to swap
     * @param minAmountAOut Minimum token A expected
     */
    function swapBforA(uint256 amountBIn, uint256 minAmountAOut) 
        external 
        nonReentrant 
    {
        require(amountBIn > 0, "Amount must be greater than 0");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");

        // Calculate output amount
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= minAmountAOut, "Slippage too high");

        // Transfer input token from user
        tokenB.transferFrom(msg.sender, address(this), amountBIn);

        // Transfer output token to user
        tokenA.transfer(msg.sender, amountAOut);

        // Update reserves
        reserveB += amountBIn;
        reserveA -= amountAOut;
        
        emit Swap(msg.sender, 0, amountBIn, amountAOut, 0);
    }
    
    /**
     * @dev Calculate output amount for swap (with fee)
     * @param amountIn Input token amount
     * @param reserveIn Input token reserve
     * @param reserveOut Output token reserve
     * @return amountOut Output token amount after fee
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Apply fee (0.3%)
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev Get current price (token B per token A)
     */
    function getPrice() external view returns (uint256) {
        require(reserveA > 0, "No liquidity");
        // Price with 18 decimals for precision
        return (reserveB * 1e18) / reserveA;
    }

    /**
     * @dev Get pool info for UI
     */
    function getPoolInfo() external view returns (
        uint256 _reserveA,
        uint256 _reserveB,
        uint256 _totalLiquidity,
        uint256 _price
    ) {
        _reserveA = reserveA;
        _reserveB = reserveB;
        _totalLiquidity = totalSupply();
        _price = reserveA > 0 ? (reserveB * 1e18) / reserveA : 0;
    }
    
    // === UTILITY FUNCTIONS ===
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}