const $messageForm = document.getElementById("chat-form");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $users = document.querySelector("#room-users");
const $roomName = document.querySelector("#room-name");
const $leaveBtn = document.querySelector(".leave-btn");
const socket = io();

// Templates
// const messageTemplate = document.querySelector("#message-template").innerHTML;
// const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
// const locationMessageTemplate = document.querySelector(
//     "#location-message-template"
// ).innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const scrollBottom = () => {
    var div = document.getElementById("messages");
    div.scrollTop = div.scrollHeight;
};

socket.on("message", (message) => {
    // const html = Mustache.render(messageTemplate, {
    //     username: message.username,
    //     message: message.text,
    //     createdAt: moment(message.createdAt).format("h:mm a"),
    // });
    // $messages.insertAdjacentHTML("beforeend", html);

    const li = document.createElement("li");
    const name = document.createElement("p");
    const messageText = document.createElement("p");

    // notification
    if (message.username == "Admin") {
        li.classList.add("notification");
        messageText.classList.add("admin-text");
    } else {
        li.classList.add("message");
        messageText.classList.add("chat-message");
        if (message.username === username.trim().toLowerCase()) {
            // user is sender
            li.classList.add("sent");
        } else {
            // other sender
            li.classList.add("received");
            name.classList.add("chat-username");
            name.innerText = message.username;
            li.appendChild(name);
        }
    }

    messageText.innerText = message.text;
    li.appendChild(messageText);
    $messages.appendChild(li);

    scrollBottom();
});

socket.on("locationMessage", (location) => {
    // const html = Mustache.render(locationMessageTemplate, {
    //     username: location.username,
    //     url: location.url,
    //     createdAt: moment(location.createdAt).format("h:mm a"),
    // });
    // $messages.insertAdjacentHTML("beforeend", html);

    const li = document.createElement("li");
    const name = document.createElement("p");
    const a = document.createElement("a");

    if (location.username === username.trim().toLowerCase()) {
        li.classList.add("sent");
    } else {
        li.classList.add("received");
        name.innerText = location.username;
    }

    li.classList.add("message");
    a.classList.add("location-anchor");
    a.href = location.url;
    a.target = "_blank";
    a.innerText = "Current location";
    name.classList.add("chat-username");
    li.append(name, a);
    $messages.appendChild(li);

    scrollBottom();
});

socket.on("roomData", ({ room, users }) => {
    $roomName.innerText = room;
    $users.innerHTML = "";
    users.forEach((user) => {
        const li = document.createElement("li");
        li.classList.add("room__username");
        li.innerText = user.username;
        $users.appendChild(li);
    });
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const messageInput = e.target.elements.message;
    messageInput.setAttribute("disabled", "disabled");
    socket.emit("sendMessage", messageInput.value, (error) => {
        if (error) {
            const li = document.createElement("li");
            const p = document.createElement("p");

            li.classList.add("notification");
            p.classList.add("admin-text");
            p.innerText = "Sheeesh! you've been muted !";

            li.appendChild(p);
            $messages.appendChild(li);
            return;
        }
        messageInput.removeAttribute("disabled");
        messageInput.value = "";
        messageInput.focus();
    });
});

$locationButton.addEventListener("click", () => {
    // e.preventDefault();
    if (!navigator.geolocation) {
        return alert("GeoLocation is not supported !");
    }

    $locationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation",
            {
                long: position.coords.longitude,
                lat: position.coords.latitude,
            },
            (feedback) => {
                $locationButton.removeAttribute("disabled");
                // console.log(feedback);
            }
        );
    });
});

$leaveBtn.addEventListener("click", () => {
    location.href = "/";
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
