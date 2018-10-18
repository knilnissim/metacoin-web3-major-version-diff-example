const createWeb3v1Contract = (web3v1) => (contractName) => {
  const contractArtifact = artifacts.require(contractName);
  const deployedAddress = contractArtifact.networks[contractArtifact.network_id].address;
  const contractInstance = new web3v1.eth.Contract(contractArtifact.abi, deployedAddress);
  return {
    deployed: function () {
      return contractInstance;
    },
    new: function () {
      return contractInstance.deploy({ data: contractArtifact.binary, arguments });
    },
  };
};
module.exports = createWeb3v1Contract;
