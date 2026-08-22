
import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { loadTheme } from "./theme.js";


// ======================================
// THEME
// ======================================

loadTheme();


// ======================================
// ELEMENTS
// ======================================

const inquiryList =
    document.getElementById("inquiryList");

const inquiryCount =
    document.getElementById("inquiryCount");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const backBtn =
    document.getElementById("backBtn");

const selectAllInquiries =
    document.getElementById("selectAllInquiries");

const deleteSelectedBtn =
    document.getElementById("deleteSelectedBtn");

const selectedCount =
    document.getElementById("selectedCount");


// ======================================
// DATA
// ======================================

let inquiries = [];


// ======================================
// LOAD ALL INQUIRIES
// ======================================

async function loadInquiries() {

    if (!inquiryList) return;

    inquiryList.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading inquiries...</p>
        </div>
    `;

    try {

        const inquiriesQuery = query(
            collection(db, "advertising_inquiries"),
            orderBy("createdAt", "desc")
        );

        const snapshot =
            await getDocs(inquiriesQuery);

        console.log(
            "Total advertising inquiries:",
            snapshot.size
        );

        inquiries = [];

        snapshot.forEach((docSnap) => {

            inquiries.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        console.log(
            "Advertising inquiries loaded:",
            inquiries
        );

        updateCount();

        renderInquiries();

    } catch (error) {

        console.error(
            "Failed to load advertising inquiries:",
            error
        );

        inquiryList.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-exclamation-circle"></i>

                <h2>
                    Unable to load inquiries
                </h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;

    }

}


// ======================================
// UPDATE COUNT
// ======================================

function updateCount() {

    if (!inquiryCount) return;

    inquiryCount.textContent =
        inquiries.length;

}


// ======================================
// FORMAT DATE
// ======================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "Date unavailable";
    }

    let date;

    if (
        typeof timestamp.toDate === "function"
    ) {

        date = timestamp.toDate();

    } else if (
        timestamp.seconds
    ) {

        date = new Date(
            timestamp.seconds * 1000
        );

    } else {

        date = new Date(timestamp);

    }

    if (isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ======================================
// RENDER
// ======================================

function renderInquiries() {

    if (!inquiryList) return;

    const search =
        searchInput?.value
            .trim()
            .toLowerCase() || "";

    const status =
        statusFilter?.value || "all";


    // ==================================
    // FILTER
    // ==================================

    const filtered =
        inquiries.filter((item) => {

            const searchableText = `

                ${item.businessName || ""}

                ${item.contactPerson || ""}

                ${item.email || ""}

                ${item.phone || ""}

                ${item.package || ""}

                ${item.message || ""}

            `.toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            const itemStatus =
                item.status || "new";


            const matchesStatus =
                status === "all" ||
                itemStatus === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    // ==================================
    // EMPTY
    // ==================================

    if (filtered.length === 0) {

        inquiryList.innerHTML = `

            <div class="empty-state">

                <i class="fas fa-inbox"></i>

                <h2>
                    No inquiries found
                </h2>

                <p>
                    There are no advertising inquiries matching your search.
                </p>

            </div>

        `;

        updateSelectionUI();

        return;

    }


    // ==================================
    // CLEAR LIST
    // ==================================

    inquiryList.innerHTML = "";


    // ==================================
    // RENDER EACH INQUIRY
    // ==================================

    filtered.forEach((item) => {

        const card =
            document.createElement("div");


        card.className =
            `inquiry-card ${
                item.read === false ||
                item.status === "new"
                    ? "unread"
                    : ""
            }`;


        const itemStatus =
            item.status || "new";


        const statusClass =
            itemStatus === "new"
                ? "status-new"
                : "status-read";


        card.innerHTML = `

            <div class="inquiry-select">

                <input
                    type="checkbox"
                    class="inquiry-checkbox"
                    data-id="${item.id}"
                >

            </div>


            <div class="inquiry-icon">

                <i class="fas fa-bullhorn"></i>

            </div>


            <div class="inquiry-content">

                <h3>
                    ${escapeHtml(
                        item.businessName ||
                        "New Client"
                    )}
                </h3>


                <div class="inquiry-contact">

                    <i class="fas fa-user"></i>

                    ${escapeHtml(
                        item.contactPerson ||
                        "No contact person"
                    )}

                    &nbsp; • &nbsp;

                    <i class="fas fa-envelope"></i>

                    ${escapeHtml(
                        item.email ||
                        "No email"
                    )}

                </div>


                <div class="inquiry-message">

                    ${escapeHtml(
                        item.message ||
                        "No message provided."
                    )}

                </div>

            </div>


            <div class="inquiry-right">

                <span class="package-badge">

                    ${escapeHtml(
                        item.package ||
                        "Advertising"
                    )}

                </span>


                <span class="status-badge ${statusClass}">

                    ${
                        itemStatus === "new"
                            ? "New"
                            : "Read"
                    }

                </span>


                <span class="inquiry-date">

                    ${formatDate(
                        item.createdAt
                    )}

                </span>

            </div>

        `;


        // ==================================
        // CARD CLICK
        // ==================================

        card.addEventListener(
            "click",
            (event) => {

                // Huwag buksan ang inquiry
                // kapag checkbox ang pinindot

                if (
                    event.target.closest(
                        ".inquiry-checkbox"
                    )
                ) {

                    return;

                }


                window.location.href =
                    `advertising-inquiry.html?id=${item.id}`;

            }
        );


        inquiryList.appendChild(card);

    });


    // ==================================
    // CONNECT CHECKBOX EVENTS
    // ==================================

    setupCheckboxes();

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ======================================
// SEARCH
// ======================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        renderInquiries
    );

}


// ======================================
// STATUS FILTER
// ======================================

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        renderInquiries
    );

}


// ======================================
// BACK
// ======================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "dashboard.html";

        }
    );

}


// ======================================
// UPDATE SELECTION UI
// ======================================

function updateSelectionUI() {

    const checkboxes =
        document.querySelectorAll(
            ".inquiry-checkbox"
        );


    const checkedBoxes =
        document.querySelectorAll(
            ".inquiry-checkbox:checked"
        );


    const count =
        checkedBoxes.length;


    // ==================================
    // SELECTED COUNT
    // ==================================

    if (selectedCount) {

        selectedCount.textContent =
            count;

    }


    // ==================================
    // DELETE BUTTON
    // ==================================

    if (deleteSelectedBtn) {

        deleteSelectedBtn.disabled =
            count === 0;

    }


    // ==================================
    // MARK ALL
    // ==================================

    if (selectAllInquiries) {

        selectAllInquiries.checked =
            checkboxes.length > 0 &&
            count === checkboxes.length;


        selectAllInquiries.indeterminate =
            count > 0 &&
            count < checkboxes.length;

    }

}


// ======================================
// SETUP CHECKBOXES
// ======================================

function setupCheckboxes() {

    const checkboxes =
        document.querySelectorAll(
            ".inquiry-checkbox"
        );


    checkboxes.forEach((checkbox) => {

        checkbox.addEventListener(
            "change",
            () => {

                updateSelectionUI();

            }
        );

    });


    updateSelectionUI();

}


// ======================================
// MARK ALL
// ======================================

if (selectAllInquiries) {

    selectAllInquiries.addEventListener(
        "change",
        () => {

            const checkboxes =
                document.querySelectorAll(
                    ".inquiry-checkbox"
                );


            checkboxes.forEach((checkbox) => {

                checkbox.checked =
                    selectAllInquiries.checked;

            });


            updateSelectionUI();

        }
    );

}


// ======================================
// DELETE SELECTED
// ======================================

if (deleteSelectedBtn) {

    deleteSelectedBtn.addEventListener(
        "click",
        async () => {

            const checkedBoxes =
                document.querySelectorAll(
                    ".inquiry-checkbox:checked"
                );


            if (checkedBoxes.length === 0) {
                return;
            }


            // ==================================
            // GET IDS
            // ==================================

            const ids = Array.from(
                checkedBoxes
            ).map(
                (checkbox) =>
                    checkbox.dataset.id
            );


            // ==================================
            // CONFIRM
            // ==================================

            const confirmed =
                confirm(
                    `Are you sure you want to delete ${ids.length} selected inquiry${ids.length > 1 ? "ies" : ""}?`
                );


            if (!confirmed) {
                return;
            }


            try {

                deleteSelectedBtn.disabled =
                    true;


                deleteSelectedBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Deleting...
                `;


                // ==================================
                // DELETE FROM FIRESTORE
                // ==================================

                await Promise.all(

                    ids.map((id) => {

                        return deleteDoc(
                            doc(
                                db,
                                "advertising_inquiries",
                                id
                            )
                        );

                    })

                );


                // ==================================
                // REMOVE FROM LOCAL ARRAY
                // ==================================

                inquiries =
                    inquiries.filter(
                        (item) =>
                            !ids.includes(item.id)
                    );


                // ==================================
                // UPDATE UI
                // ==================================

                updateCount();

                renderInquiries();


                if (selectAllInquiries) {

                    selectAllInquiries.checked =
                        false;

                    selectAllInquiries.indeterminate =
                        false;

                }


                if (selectedCount) {

                    selectedCount.textContent =
                        "0";

                }


                alert(
                    `${ids.length} inquiry${ids.length > 1 ? "ies" : ""} deleted successfully.`
                );


            } catch (error) {

                console.error(
                    "Failed to delete selected inquiries:",
                    error
                );


                alert(
                    "Failed to delete selected inquiries. Please try again."
                );


            } finally {

    deleteSelectedBtn.disabled = true;

    const countElement =
        deleteSelectedBtn.querySelector("#selectedCount");

    if (countElement) {
        countElement.textContent = "0";
    }

}

        }
    );

}


// ======================================
// START
// ======================================

loadInquiries();
