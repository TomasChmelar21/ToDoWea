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
        logout();
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
                logout()
            }
        } else {
            logout()
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
            logout()
        }

        // Additional validation checks can be added here

        return true;
    } catch (error) {
        logout()
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
        logout()
    }
}


function updateRecord(endpoint, data = null) {
    // Check for a valid token
    var token = getCookie('token');
    if (!isValidToken(token)) {
        logout()
    }

    // Create a new XMLHttpRequest object 
    var xhr = new XMLHttpRequest();

    // Define the callback function
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                getUsers();
            } else {
                alert("failed to update")
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
        logout()
    }
    var xhr = new XMLHttpRequest();

    // Define the callback function
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                getUsers();
            } else {
                alert("Failed to delete record.");
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
    token = getCookie('token');
    xhr.open("GET", `https://tomaschmelarapp-backend.onrender.com/users/${endpoint}/${token}`, true);
    // Send the request over the network
    xhr.send(null);
}

function sendDataCallback() {
    // Check if the response is ready
    if (xhr.readyState == 4) {
        if (xhr.status == 201) {
            getUsers();
        } else {
            alert("Failed to add data.");
        }
    }
}

function filterTasks(filterType) {
    // Call server to get filtered data
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
        logout();
    }

    var dataToSend = xssFilters.inHTMLData(document.getElementById('data-input').value);
    if (!dataToSend) {
        alert("Data is empty.");
        return;
    }

    // Create the data object with the desired structure
    var newData = {
        "text": dataToSend,
        "token": token,
        "hotovo": 0
    };

    // Create a new XMLHttpRequest object
    var xhr = getXmlHttpRequestObject();

    // Define the callback function
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 201) {
                getUsers();
            } else {
                alert("Failed to add data.");
            }
        }
    };

    // Asynchronous request
    xhr.open("POST", "https://tomaschmelarapp-backend.onrender.com/users", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.send(JSON.stringify(newData));
}



// Automatically fetch user data on application start
document.addEventListener("DOMContentLoaded", function () {
    getUsers();
});
