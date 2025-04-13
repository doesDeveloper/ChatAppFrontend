
let name;
let roomId;
var stompClient = null;
var chatBox = null;
let currentPage = 0;
const pageSize = 10;
const host = "http://localhost:8080";
// const host = "https://2604d3452be6937ad037e91589318b56.serveo.net";
do {
    name = prompt("Enter your name (cannot be empty or canceled):");
} while (name === null || name.trim() === "");
do {
    roomId = prompt("Enter your roomID (cannot be empty or canceled):");
} while (roomId === null || roomId.trim() === "");

function loadHistory() {
    const previousScrollHeight = chatBox.scrollHeight;

    fetch(`${host}/chat/history/${roomId}?page=${currentPage}&size=${pageSize}`)
        .then(res => res.json())
        .then(messages => {
            // const chatBox = document.getElementById("chat-box");
            if (messages.length == 0) return;
            messages.forEach(msg => {
                showHistory(msg) // prepend for top-down scroll
            });
            const newScrollHeight = chatBox.scrollHeight;
            chatBox.scrollTop = newScrollHeight - previousScrollHeight;
            currentPage++;
        })
        .catch(err => console.error("Failed to load history", err));
}

function connect() {
    var socket = new SockJS(host + '/ws');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        stompClient.subscribe('/topic/chat/' + roomId, function (message) {
            showMessage(JSON.parse(message.body));

        });
    });
}

function sendMessage() {
    var messageContent = document.getElementById("message").value;
    if (messageContent) {
        var message = {
            sender: name,
            timestamp: Date.now(),
            content: messageContent
        };
        stompClient.send("/app/chat/" + roomId, {}, JSON.stringify(message));
        document.getElementById("message").value = '';
    }
}

function showMessage(message) {
    var messageElement = document.createElement("p");
    messageElement.textContent = message.sender + ": " + message.content;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

}
function showHistory(message) {
    var messageElement = document.createElement("p");
    messageElement.textContent = message.sender + ": " + message.content;
    chatBox.prepend(messageElement);
}
function hookChatUpdate() {
    chatBox = document.getElementById("chat-box");
    console.log("chatBox", chatBox)
    chatBox.addEventListener('scroll', () => {
        if (chatBox.scrollTop === 0) { // Reached top
            loadHistory();
        }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}
// pressing enter sends the chat
function hookInput() {
    document.getElementById("message").addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
}
function afterLoading() {
    hookChatUpdate();
    loadHistory();
    hookInput();
}

connect();