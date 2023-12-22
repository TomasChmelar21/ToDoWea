var xhr = null;

function getXmlHttpRequestObject() {
    if (!xhr) {
        // Create a new XMLHttpRequest object 
        xhr = new XMLHttpRequest();
    }
    return xhr;
}


document.addEventListener('DOMContentLoaded', function () {
    getUsers();
});

function getUsers() {
    var jsonPre = document.getElementById('json-data');
    if (jsonPre) {
        // Make the asynchronous request
        var xhr = getXmlHttpRequestObject();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var jsonData = JSON.parse(xhr.responseText);
                jsonPre.textContent = JSON.stringify(jsonData, null, 2);
            }
        };

        // Asynchronous requests
        xhr.open("GET", `https://tomaschmelarapp-backend.onrender.com/usersjson`, true);
        // Send the request over the network
        xhr.send(null);
    } else {
        console.error("Element with id 'json-data' not found.");
    }
}
