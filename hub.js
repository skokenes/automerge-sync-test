import A from "Automerge";

const channel = window;

let hubDoc = A.init();
let syncStates = {
  A: A.initSyncState(),
  B: A.initSyncState(),
};

function updatePeers() {
  const [nextSyncStateA, syncMessageA] = A.generateSyncMessage(
    hubDoc,
    syncStates["A"]
  );
  syncStates["A"] = nextSyncStateA;

  if (syncMessageA) {
    channel.postMessage({
      source: "hub",
      target: "A",
      syncMessage: syncMessageA,
    });
  }

  const [nextSyncStateB, syncMessageB] = A.generateSyncMessage(
    hubDoc,
    syncStates["B"]
  );
  syncStates["B"] = nextSyncStateB;

  if (syncMessageB) {
    channel.postMessage({
      source: "hub",
      target: "B",
      syncMessage: syncMessageB,
    });
  }
}

channel.addEventListener("message", ({ data }) => {
  const { source, target, syncMessage } = data;
  if (target !== "hub") return;

  const [nextDoc, nextSyncState, patch] = A.receiveSyncMessage(
    hubDoc,
    syncStates[source],
    syncMessage
  );
  hubDoc = nextDoc;
  syncStates[source] = nextSyncState;

  updatePeers();
});
