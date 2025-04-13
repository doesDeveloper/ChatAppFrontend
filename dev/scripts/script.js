let roomName;
let username;
let roomId;
var stompClient = null;
var chatBox = null;
let currentPage = 0;
const pageSize = 10;
const host = "http://localhost:8080";
// const host = "https://2604d3452be6937ad037e91589318b56.serveo.net";

function loadHistory() {
    const previousScrollHeight = chatBox.scrollHeight;

    fetch(`${host}/chat/history/${roomId}?page=${currentPage}&size=${pageSize}`)
        .then(res => res.json())
        .then(messages => {
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
    hookChatUpdate();
    loadHistory();
}

function sendMessage() {
    var messageContent = document.getElementById("message").value;
    if (messageContent) {
        var message = {
            sender: username,
            timestamp: Date.now(),
            content: messageContent
        };
        stompClient.send("/app/chat/" + roomId, {}, JSON.stringify(message));
        document.getElementById("message").value = '';
    }
}

function showMessage(message) {
    var messageElement = createMessageElement(message);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

}
function showHistory(message) {
    var messageElement = createMessageElement(message);
    chatBox.prepend(messageElement);
}
function createMessageElement(message) {
    var messageElement = document.createElement("div")
    messageElement.classList.add("message");
    messageElement.classList.add(message.sender == username ? "messagesend" : "messagerec");
    var senderElement = document.createElement("div");
    senderElement.classList.add("sender");
    senderElement.textContent = message.sender;
    messageElement.appendChild(senderElement);
    var contentElement = document.createElement("div");
    contentElement.classList.add("content");
    contentElement.textContent = message.content;
    messageElement.appendChild(contentElement);
    return messageElement;
}
function hookChatUpdate() {
    chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = '';
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

function submitConnect() {
    roomId = document.getElementById("roomIdInput").value.trim();
    username = document.getElementById("usernameInput").value.trim();
    roomName = document.getElementById("roomNameInput").value.trim();
    console.log("Reached here")
    if (username != '' && roomId != '' && roomName != '') {
        document.getElementById("modal").style.display = "none";
        localStorage.setItem('username', username);
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('roomName', roomName);
        document.getElementById("roomName").textContent = roomName;
        document.getElementById("roomId").textContent = `Room Id: ${roomId}`;
        connect();
    }
}
function onLoad() {
    roomId = localStorage.getItem('roomId');
    username = localStorage.getItem('username');
    roomName = localStorage.getItem('roomName');

    if (roomId != null && username != null && roomName != null) {
        document.getElementById("roomIdInput").value = roomId;
        document.getElementById("usernameInput").value = username;
        document.getElementById("roomNameInput").value = roomName;
    }
    document.getElementById("roomform").addEventListener("submit", function (event) {
        event.preventDefault();
        submitConnect();
    });
    hookInput();
}