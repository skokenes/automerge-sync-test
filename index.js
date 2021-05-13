import A from "Automerge";
import "./hub";

const channel = window;

const initialDoc = {
  type: "document",
  children: [{ text: new A.Text("hello") }, { text: new A.Text("world") }],
};

let aDoc = A.from(initialDoc);
let aHubSyncState = A.initSyncState();

function changeA(changeFn) {
  aDoc = A.change(aDoc, changeFn);
  const [nextSyncState, syncMessage] = A.generateSyncMessage(
    aDoc,
    aHubSyncState
  );
  aHubSyncState = nextSyncState;
  if (syncMessage) {
    channel.postMessage({ target: "hub", source: "A", syncMessage });
  }

  renderDocs();
}

let bDoc = A.from(initialDoc);
let bHubSyncState = A.initSyncState();

function changeB(changeFn) {
  bDoc = A.change(bDoc, changeFn);
  const [nextSyncState, syncMessage] = A.generateSyncMessage(
    bDoc,
    bHubSyncState
  );
  bHubSyncState = nextSyncState;
  if (syncMessage) {
    channel.postMessage({ target: "hub", source: "B", syncMessage });
  }
  renderDocs();
}

channel.addEventListener("message", ({ data }) => {
  const { source, target, syncMessage } = data;

  if (target === "hub") return;

  if (target === "A") {
    const [nextDoc, nextSyncState] = A.receiveSyncMessage(
      aDoc,
      aHubSyncState,
      syncMessage
    );
    aDoc = nextDoc;
    const [nextNextSyncState, replyMessage] = A.generateSyncMessage(
      aDoc,
      nextSyncState
    );
    aHubSyncState = nextNextSyncState;
    if (replyMessage) {
      channel.postMessage({
        target: "hub",
        source: "A",
        syncMessage: replyMessage,
      });
    }
  }

  if (target === "B") {
    const [nextDoc, nextSyncState] = A.receiveSyncMessage(
      bDoc,
      bHubSyncState,
      syncMessage
    );
    bDoc = nextDoc;
    const [nextNextSyncState, replyBMsg] = A.generateSyncMessage(
      bDoc,
      nextSyncState
    );
    bHubSyncState = nextNextSyncState;
    if (replyBMsg) {
      channel.postMessage({
        target: "hub",
        source: "B",
        syncMessage: replyBMsg,
      });
    }
  }

  renderDocs();
});

function renderDocs() {
  document.getElementById("docA").innerHTML = JSON.stringify(aDoc, null, 2);
  document.getElementById("docB").innerHTML = JSON.stringify(bDoc, null, 2);
}

renderDocs();

const TIME_BETWEEN_INSERTS = 500;

const a_ITERATIONS = 100;
let a_i = 0;
function addTextToA() {
  changeA((doc) => {
    doc.children[0].text.insertAt(0, "x");
  });
  a_i++;
  if (a_i < a_ITERATIONS) {
    setTimeout(() => {
      addTextToA();
    }, TIME_BETWEEN_INSERTS);
  }
}

document.getElementById("add-a").addEventListener("click", () => {
  addTextToA();
});

const b_ITERATIONS = 100;
let b_i = 0;
function addTextToB() {
  changeB((doc) => {
    doc.children[1].text.insertAt(0, "a");
  });
  b_i++;
  if (b_i < b_ITERATIONS) {
    setTimeout(() => {
      addTextToB();
    }, TIME_BETWEEN_INSERTS);
  }
}

document.getElementById("add-b").addEventListener("click", () => {
  addTextToB();
});
