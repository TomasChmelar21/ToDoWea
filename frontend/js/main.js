var xhr = null;

function getXmlHttpRequestObject() {
    if (!xhr) {
        // Create a new XMLHttpRequest object 
        xhr = new XMLHttpRequest();
    }
    return xhr;
}

document.addEventListener("DOMContentLoaded", function () {
    var token = getCookie('token');

    if (isValidToken(token)) {
        getUsers();
    } else {
        console.error("Invalid token. Access denied.");
        window.location.href = './index.html';
    }
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
}

function logout() {
    // Clear the cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Redirect the user to the login page
    window.location.href = './index.html';
}

function dataCallback() {
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            console.log("User data received!");
            var token = getCookie('token');

            if (isValidToken(token)) {
                var dataDiv = document.getElementById('result-container');
                var responseData = JSON.parse(xhr.responseText);
                var filterType = document.querySelector('input[name="filter"]:checked')?.value;

                var recordsHTML = responseData.map(function (item) {
                    var isCompleted = item.hotovo === 1;

                    if (
                        (filterType === 'completed' && !isCompleted) ||
                        (filterType === 'uncompleted' && isCompleted)
                    ) {
                        return '';
                    }

                    return `
                        <div class="record-container ${isCompleted ? 'completed' : ''}">
                            <p class="record-text">${item.text}</p>
                            <div class="action-buttons">
                                ${isCompleted ? '' : '<button class="btn btn-success" onclick="markAsDone(\'' + item.text + '\')">Hotovo</button>'}
                                ${isCompleted ? '' : '<button class="btn btn-warning" onclick="editRecord(\'' + item.text + '\')">Upravit</button>'}
                                <button class="btn btn-danger" onclick="deleteRecord('${item.text}')">Smazat</button>
                            </div>
                        </div>
                    `;
                });

                dataDiv.innerHTML = recordsHTML.join('');
            } else {
                console.error("Invalid token. Access denied.");
                window.location.href = '../index.html';
            }
        } else {
            console.error("Failed to fetch user data.");
        }
    }
}


// Function to validate JWT token
function isValidToken(token) {
    if (!token) {
        return false;
    }

    // Split the token into header, payload, and signature
    const [header, payload, signature] = token.split('.');

    try {
        // Decode the base64-encoded payload
        const decodedPayload = JSON.parse(atob(payload));

        // Check if the token is expired or perform other validation checks
        const expirationTime = decodedPayload.exp * 1000; // Convert seconds to milliseconds
        const currentTime = new Date().getTime();

        if (currentTime > expirationTime) {
            console.error("Token has expired.");
            return false;
        }

        // Additional validation checks can be added here

        return true;
    } catch (error) {
        console.error("Error decoding or validating token:", error);
        return false;
    }
}



function markAsDone(text) {
    var token = getCookie('token');

    if (isValidToken(token)) {
        // Show a confirmation dialog
        var isConfirmed = window.confirm(`Opravdu chcete označit záznam "${text}" jako hotový?`);

        if (isConfirmed) {
            // Call the server to update the 'hotovo' property
            updateRecord(`hotovo/${encodeURIComponent(text)}`);
        }
    } else {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
    }
}


function updateRecord(endpoint, data = null) {
    // Check for a valid token
    var token = getCookie('token');
    if (!isValidToken(token)) {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
        return;
    }

    // Create a new XMLHttpRequest object 
    var xhr = new XMLHttpRequest();

    // Define the callback function
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("Update response received!");
                // Update the record list after successful update
                getUsers();
            } else {
                console.error("Failed to update record.");
            }
        }
    };

    // Asynchronous request
    xhr.open("PUT", `https://tomaschmelarapp-backend.onrender.com/users/${endpoint}`, true);
    if (data !== null) {
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send();
    }
}

function editRecord(text) {
    // Show a prompt dialog to get the new text
    var newText = window.prompt(`Zadejte nový text pro záznam "${text}":`, text);
    
    if (newText !== null) {  // Check if the user clicked "OK"
        // Call the server to update the text
        updateRecord(`text/${encodeURIComponent(text)}`, { "newText": newText });
    }
}

function deleteRecord(text) {
    // Show a confirmation dialog
    var isConfirmed = window.confirm(`Opravdu chcete smazat záznam "${text}"?`);
    
    if (isConfirmed) {
        // Call the server to delete the record
        deleteRecordOnServer(encodeURIComponent(text));
    }
}

function deleteRecordOnServer(text) {
    // Check for a valid token
    var token = getCookie('token');
    if (!isValidToken(token)) {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
        return;
    }

    // Create a new XMLHttpRequest object 
    var xhr = new XMLHttpRequest();

    // Define the callback function
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                console.log("Delete response received!");
                // Update the record list after successful delete
                getUsers();
            } else {
                console.error("Failed to delete record.");
            }
        }
    };

    // Asynchronous request
    xhr.open("DELETE", `https://tomaschmelarapp-backend.onrender.com/users/smazat/${text}`, true);
    xhr.send();
}

function getUsers(endpoint = 'filtr') {
    xhr = getXmlHttpRequestObject();
    xhr.onreadystatechange = dataCallback;
    // Asynchronous requests
    token = getCookie('token');
    xhr.open("GET", `https://tomaschmelarapp-backend.onrender.com/users/${endpoint}/${token}`, true);
    // Send the request over the network
    xhr.send(null);
}

function sendDataCallback() {
    // Check if the response is ready
    if (xhr.readyState == 4) {
        if (xhr.status == 201) {
            console.log("Data creation response received!");

            // Update the record list with the new data
            getUsers();
        } else {
            console.error("Failed to add data.");
        }
    }
}

function filterTasks(filterType) {
    // Call the server to get filtered data
    var endpoint;
    if(filterType == "all"){ getUsers();}
    else{
    endpoint = filterType === 'completed' ? 'hotovo' : (filterType === 'uncompleted' ? 'nesplneno' : 'users');
    getUsers(endpoint);}
}

function sendData() {
    // Check for a valid token
    var token = getCookie('token');
    if (!isValidToken(token)) {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
        return;
    }

    var dataToSend = xssFilters.inHTMLData(document.getElementById('data-input').value);
    if (!dataToSend) {
        console.log("Data is empty.");
        return;
    }

    console.log("Sending data: " + dataToSend);

    // Create the data object with the desired structure
    var newData = {
        "text": dataToSend,
        "token": token,  // Use the token retrieved from cookies
        "hotovo": 0
    };

    // Create a new XMLHttpRequest object
    var xhr = getXmlHttpRequestObject();

    // Define the callback function
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 201) {
                console.log("Data added successfully.");
                // Optionally, update the UI or perform other actions
                getUsers();
            } else {
                console.error("Failed to add data.");
                // Optionally, handle errors or display a message to the user
            }
        }
    };

    // Asynchronous request
    xhr.open("POST", "https://tomaschmelarapp-backend.onrender.com/users", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    // Send the request over the network with the JSON data
    xhr.send(JSON.stringify(newData));
}



// Automatically fetch user data on application start
document.addEventListener("DOMContentLoaded", function () {
    getUsers();
});
