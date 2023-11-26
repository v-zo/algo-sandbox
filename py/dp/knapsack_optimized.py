def knapsack_optimized(values, weights, W):
    n = len(values)
    dp = [0 for x in range(W + 1)]

    for i in range(n):
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])

    print(dp)

    return dp[W]

values = [60, 100, 120]
weights = [10, 20, 30]
W = 50
print("Maximum value in knapsack =", knapsack_optimized(values, weights, W))
