var xhr = null;

function getXmlHttpRequestObject() {
    if (!xhr) {
        // Create a new XMLHttpRequest object 
        xhr = new XMLHttpRequest();
    }
    return xhr;
}

document.addEventListener("DOMContentLoaded", function () {
    var token = localStorage.getItem('token');

    if (isValidToken(token)) {
        getUsers();
    } else {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
    }
});



function dataCallback() {
    // Check if the response is ready
    if (xhr.readyState == 4) {
        if (xhr.status == 200) {
            console.log("User data received!");
            var token = localStorage.getItem('token');
            var username = localStorage.getItem('username');
            
            // Validate the JWT token
            if (isValidToken(token)) {
                console.log("Token:", token);
                console.log("username:", username);
                var dataDiv = document.getElementById('result-container');
                // Parse the JSON response
                var responseData = JSON.parse(xhr.responseText);

                // Apply the filter, if any
                var filterType = document.querySelector('input[name="filter"]:checked')?.value;

                // Generate HTML for each record based on the filter and username
                var recordsHTML = responseData.map(function (item) {
                    // Check if the record is completed (hotovo is 1)
                    var isCompleted = item.hotovo === 1;

                    // Apply the filter, if any, and only show records where the username matches
                    if (
                        (filterType === 'completed' && !isCompleted) ||
                        (filterType === 'uncompleted' && isCompleted) ||
                        (username !== item.user)
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

                // Set current data HTML
                dataDiv.innerHTML = recordsHTML.join('');
            } else {
                console.error("Invalid token. Access denied.");

                // Redirect to ../index.html on invalid token
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
    var token = localStorage.getItem('token');

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
    var token = localStorage.getItem('token');
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
    xhr.open("PUT", `http://localhost:6969/users/${endpoint}`, true);
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
    var token = localStorage.getItem('token');
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
    xhr.open("DELETE", `http://localhost:6969/users/smazat/${text}`, true);
    xhr.send();
}

function getUsers(endpoint = 'users') {
    console.log("Get users...");
    xhr = getXmlHttpRequestObject();
    xhr.onreadystatechange = dataCallback;
    // Asynchronous requests
    xhr.open("GET", `http://localhost:6969/${endpoint}`, true);
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
    var endpoint = filterType === 'completed' ? 'hotovo' : (filterType === 'uncompleted' ? 'nesplneno' : 'users');
    getUsers(endpoint);
}

function sendData() {
    // Check for a valid token
    var token = localStorage.getItem('token');
    if (!isValidToken(token)) {
        console.error("Invalid token. Access denied.");
        // Optionally, you can disable or hide functionality here
        return;
    }

    var dataToSend = document.getElementById('data-input').value;
    if (!dataToSend) {
        console.log("Data is empty.");
        return;
    }

    console.log("Sending data: " + dataToSend);

    // Get the username from localStorage
    var username = localStorage.getItem('username');

    // Create the data object with the desired structure
    var newData = {
        "text": dataToSend,
        "user": username,  // Use the username retrieved from localStorage
        "hotovo": 0
    };

    xhr = getXmlHttpRequestObject();
    xhr.onreadystatechange = sendDataCallback;
    // Asynchronous requests
    xhr.open("POST", "http://localhost:6969/users", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // Send the request over the network with the JSON data
    xhr.send(JSON.stringify(newData));
}


// Automatically fetch user data on application start
document.addEventListener("DOMContentLoaded", function () {
    getUsers();
});
