let roomName;
let username;
let roomId;
var stompClient = null;
var chatBox = null;
let currentPage = 0;
const pageSize = 10;
const host = "http://localhost:8080";
// const host = "https://1dfb8fcf7f9767cb680dc5194db3695d.serveo.net";

// function loadHistory() {
//     const previousScrollHeight = chatBox.scrollHeight;

//     fetch(`${host}/chat/history/${roomId}?page=${currentPage}&size=${pageSize}`)
//         .then(res => res.json())
//         .then(messages => {
//             if (messages.length == 0) { currentPage--; return; };
//             messages.forEach(msg => {
//                 showHistory(msg) // prepend for top-down scroll
//             });
//             const newScrollHeight = chatBox.scrollHeight;
//             chatBox.scrollTop = newScrollHeight - previousScrollHeight;
//         })
//         .catch(err => { console.error("Failed to load history", err); currentPage--; });
//     currentPage++;
// }

function loadHistory() {
    if (isLoadingChat) return;
    isLoadingChat = true;

    const previousScrollHeight = chatBox.scrollHeight;
    const pageToFetch = currentPage;

    fetch(`${host}/chat/history/${roomId}?page=${pageToFetch}&size=${pageSize}`)
        .then(res => res.json())
        .then(messages => {
            if (messages.length === 0) {
                return; // no need to decrement page; just stop loading
            }

            messages.forEach(msg => {
                showHistory(msg); // should prepend to chatBox
            });

            const newScrollHeight = chatBox.scrollHeight;
            chatBox.scrollTop = newScrollHeight - previousScrollHeight;

            currentPage++; // increment only if successful and not empty
        })
        .catch(err => {
            console.error("Failed to load history", err);
        })
        .finally(() => {
            isLoadingChat = false;
        });
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
let isLoadingChat = false;


function hookChatUpdate() {
    chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = '';
    chatBox.addEventListener('scroll', () => {
        if (chatBox.scrollTop === 0 && !isLoadingChat) {
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
    if (username != '' && roomId != '' && roomName != '') {
        document.getElementById("modalJoin").style.display = "none";
        localStorage.setItem('username', username);
        if (!rooms.find(room => room.roomId == roomId)) {
            rooms.push({ roomId: roomId, roomName: roomName });
            localStorage.setItem('rooms', JSON.stringify(rooms));
        }
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('roomName', roomName);
        document.getElementById("roomName").textContent = roomName;
        document.getElementById("roomId").textContent = `Room Id: ${roomId}`;
        connect();
    }
}
function onLoad() {
    document.getElementById("modalJoin").style.display = "none";
    roomId = localStorage.getItem('roomId');
    username = localStorage.getItem('username');
    roomName = localStorage.getItem('roomName');

    if (username != null && rooms.length > 0) {
        document.getElementById("roomName").textContent = roomName;
        document.getElementById("roomId").textContent = `Room Id: ${roomId}`;
        connect();
    } else {
        document.getElementById("modalJoin").style.display = "block";
        if (roomId != null && username != null && roomName != null) {
            document.getElementById("roomIdInput").value = roomId;
            document.getElementById("usernameInput").value = username;
            document.getElementById("roomNameInput").value = roomName;
        }
    }

    document.getElementById("roomform").addEventListener("submit", function (event) {
        event.preventDefault();
        submitConnect();
    });
    document.getElementById("addroomform").addEventListener("submit", function (event) {
        event.preventDefault();
        addRoom();
    });
    hookInput();
    loadRoomsContact();
}

function addRoom() {
    hideRoomModal();
    let room = {
        roomName: document.getElementById("addroomNameInput").value.trim(),
        roomId: document.getElementById("addroomIdInput").value.trim()
    }
    if (room.roomName != '' && room.roomId != '') {
        rooms.push(room);
        localStorage.setItem('rooms', JSON.stringify(rooms));
        appendRoom(room); //createRoomContact(room);
    }
}
function showRoomModal() {
    document.getElementById("modalCreate").style.display = "block";
}
let contactsVisible = false;
function toggleContacts() {
    console.log("was heree")
    contactsVisible = !contactsVisible;
    if (contactsVisible) {
        document.getElementById("contacts").style.transform = "translate(-23rem, -50%)";
    } else {
        document.getElementById("contacts").style.transform = "translate(-6rem, -50%)";
    }
}

let rooms = JSON.parse(localStorage.getItem('rooms')) || [];
let picsClass = ["thor", "stark", "rogers", "banner", "danvers"];
function createRoomContact(room) {
    var contact = document.createElement("div");
    contact.classList.add("contact");
    var pic = document.createElement("div");
    pic.classList.add("pic");
    pic.classList.add(picsClass[Math.floor(Math.random() * 5)]);
    contact.appendChild(pic);
    var name = document.createElement("div");
    name.classList.add("name");
    name.textContent = room.roomName;
    contact.appendChild(name);
    var message = document.createElement("div");
    message.classList.add("message");
    message.textContent = `Room Id: ${room.roomId}`;
    contact.appendChild(message);
    contact.onclick = function () {
        joinRoom(room);
    }
    return contact;
}
function loadRoomsContact() {
    rooms.forEach(room => {
        appendRoom(room);

    });
}


function appendRoom(room) {
    var contact = createRoomContact(room);
    document.getElementById("contacts").insertBefore(contact, document.getElementById("addRoom"));
}

function joinRoom(room) {
    roomId = room.roomId;
    roomName = room.roomName;
    console.log(roomId, roomName)
    if (closeChat()) {
        document.getElementById("roomName").textContent = roomName;
        document.getElementById("roomId").textContent = `Room Id: ${roomId}`;
        localStorage.setItem('roomId', roomId);
        localStorage.setItem('roomName', roomName);
        connect();
    }
    // document.getElementById("roomIdInput").value = roomId;
    // document.getElementById("roomNameInput").value = roomName;
    // document.getElementById("roomform").submit();
}
function closeChat() {
    if (stompClient != null) {
        stompClient.disconnect();
        document.getElementById("chat-box").innerHTML = '';
        currentPage = 0;
        return true;
    } else {
        return false;
    }
}

function hideRoomModal() {
    document.getElementById("modalCreate").style.display = "none";
}