import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const managerContainer = document.getElementById("managerContainer");
const editorContainer = document.getElementById("editorContainer");
const reporterContainer = document.getElementById("reporterContainer");

// ===============================
// OUR MISSION
// ===============================

function showMission() {

Swal.fire({

icon: "info",

title: "OUR MISSION",

confirmButtonText: "Close",

confirmButtonColor: "#d50000",

width: 700,

html: `

<div style="text-align:left;line-height:1.9;font-size:15px;">

<p>
Primetime News Cotabato is committed to delivering
accurate, balanced, fair and timely news that informs,
inspires, and empowers every community.
</p>

<br>

<p>
We strive to uphold the highest standards of journalism
through integrity, professionalism, accountability,
and public service.
</p>

<br>

<p>
Every story we produce is guided by truth,
responsibility, and our commitment to serve the people
of Cotabato and the Bangsamoro Region.
</p>

</div>

`

});

}

// ===============================
// OUR VISION
// ===============================

function showVision() {

Swal.fire({

icon: "success",

title: "OUR VISION",

confirmButtonText: "Close",

confirmButtonColor: "#d50000",

width:700,

html:`

<div style="text-align:left;line-height:1.9;font-size:15px;">

<p>
To become one of the most trusted, credible,
and respected digital news organizations
in Mindanao.
</p>

<br>

<p>
We envision a newsroom that promotes transparency,
innovation, responsible journalism,
and meaningful public engagement.
</p>

<br>

<p>
Our goal is to connect communities through factual,
independent, and impactful storytelling.
</p>

</div>

`

});

}

// ===============================
// OUR VALUES
// ===============================

function showValues(){

Swal.fire({

icon:"question",

title:"OUR CORE VALUES",

confirmButtonText:"Close",

confirmButtonColor:"#d50000",

width:700,

html:`

<div style="text-align:left;line-height:1.9;font-size:15px;">

<ul style="padding-left:20px;">

<li><b>Integrity</b> — We uphold honesty and ethical journalism.</li>

<li><b>Accuracy</b> — Every report is verified before publication.</li>

<li><b>Fairness</b> — Every side deserves to be heard.</li>

<li><b>Transparency</b> — We remain accountable to the public.</li>

<li><b>Public Service</b> — We serve our communities through responsible reporting.</li>

<li><b>Excellence</b> — We continuously improve our newsroom and storytelling.</li>

</ul>

</div>

`

});

}

async function loadTeam(){

    managerContainer.innerHTML = "";
    editorContainer.innerHTML = "";
    reporterContainer.innerHTML = "";

    const snapshot = await getDocs(collection(db,"team"));

    snapshot.forEach(doc=>{

        const person = doc.data();

        const card = `
        <div class="teamCard">

            <img src="${person.image || "images/default-user.jpg"}">

            <div class="teamContent">

                <h3>${person.name}</h3>

                <h4>${person.position}</h4>

                <p>${person.description || ""}</p>

                <div class="socials">

                    ${
                        person.facebook
                        ? `<a href="${person.facebook}" target="_blank">
                            <i class="fab fa-facebook-f"></i>
                           </a>`
                        : ""
                    }

                    ${
                        person.email
                        ? `<a href="mailto:${person.email}">
                            <i class="fas fa-envelope"></i>
                           </a>`
                        : ""
                    }

                </div>

            </div>

        </div>
        `;

        if(person.position === "Station Manager"){

            managerContainer.innerHTML += `
            <div class="managerCard">

                <img src="${person.image || "images/default-user.jpg"}">

                <div class="managerInfo">

                    <h2>${person.name}</h2>

                    <h4>${person.position}</h4>

                    <p>${person.description || ""}</p>

                    <div class="socials">

                        ${
                            person.facebook
                            ? `<a href="${person.facebook}" target="_blank">
                                <i class="fab fa-facebook-f"></i>
                               </a>`
                            : ""
                        }

                        ${
                            person.email
                            ? `<a href="mailto:${person.email}">
                                <i class="fas fa-envelope"></i>
                               </a>`
                            : ""
                        }

                    </div>

                </div>

            </div>
            `;

        }

        else if(person.position === "Editor"){

            editorContainer.innerHTML += card;

        }

        else if(person.position === "Reporter"){

            reporterContainer.innerHTML += card;

        }

    });

}

loadTeam();

window.showMission = showMission;
window.showVision = showVision;
window.showValues = showValues;