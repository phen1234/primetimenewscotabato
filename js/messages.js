import { db } from "./firebase.js";

import {

collection,
query,
orderBy,
onSnapshot,
doc,
updateDoc,
deleteDoc

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const container = document.getElementById("messagesContainer");

const emptyState = document.getElementById("emptyState");

const content = document.getElementById("messageContent");

const viewName = document.getElementById("viewName");
const viewEmail = document.getElementById("viewEmail");
const viewSubject = document.getElementById("viewSubject");
const viewMessage = document.getElementById("viewMessage");
const viewDate = document.getElementById("viewDate");

const markReadBtn = document.getElementById("markRead");
const deleteBtn = document.getElementById("deleteMessage");

let selectedId = null;

const q = query(
    collection(db, "contactMessages"),
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

    container.innerHTML = "";

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        const item = document.createElement("div");

        item.className =
            data.status === "unread"
                ? "message-item unread"
                : "message-item";

        item.innerHTML = `
            <h3>${data.name}</h3>
            <p>${data.subject}</p>
            <small>${data.email}</small>
        `;

        item.addEventListener("click", () => {

            selectedId = docSnap.id;

            emptyState.style.display = "none";
            content.style.display = "block";

            viewName.textContent = data.name;
            viewEmail.textContent = data.email;
            viewSubject.textContent = data.subject;
            viewMessage.textContent = data.message;

            if (data.createdAt) {

                viewDate.textContent =
                    data.createdAt.toDate().toLocaleString();

            } else {

                viewDate.textContent = "Just now";

            }

        });

        container.appendChild(item);

    });

});

// MARK AS READ

markReadBtn.addEventListener("click", async () => {

    if (!selectedId) return;

    await updateDoc(doc(db, "contactMessages", selectedId), {

        status: "read"

    });

    alert("Message marked as read.");

});

// DELETE MESSAGE

deleteBtn.addEventListener("click", async () => {

    if (!selectedId) return;

    if (!confirm("Delete this message?")) return;

    await deleteDoc(doc(db, "contactMessages", selectedId));

    alert("Message deleted.");

    content.style.display = "none";
    emptyState.style.display = "block";

    selectedId = null;

});