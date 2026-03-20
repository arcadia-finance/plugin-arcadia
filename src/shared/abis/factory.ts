export const factoryAbi = [
  {
    type: "function",
    name: "createAccount",
    inputs: [
      { name: "salt", type: "uint32", internalType: "uint32" },
      { name: "accountVersion", type: "uint256", internalType: "uint256" },
      { name: "creditor", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "account", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "latestAccountVersion",
    inputs: [],
    outputs: [{ name: "", type: "uint88", internalType: "uint88" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allAccountsLength",
    inputs: [],
    outputs: [
      {
        name: "numberOfAccounts",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ownerOfAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "owner_", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;
