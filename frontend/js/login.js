document.addEventListener("DOMContentLoaded", function () {
    var loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent the form from submitting in the traditional way

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        if (!username || !password) {
            console.log("Username and password are required.");
            // Optionally display a message to the user that both username and password are required
            return;
        }

        console.log("Logging in...");

        // Create the data object with the username and password
        var loginData = {
            "username": username,
            "password": password
        };

        fetch("http://localhost:6969/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Login failed.");
            }
            console.log("Login response received!");
            
            // Parse JSON response
            return response.json();
        })
        .then(data => {
            // Extract token and username from the response
            var token = data.token;
            var username = data.username;

            // Set the token and username as cookies
            var token = data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('username', username);
            document.cookie = 'username=' + encodeURIComponent(username);

            console.log("Token:", token);
            console.log("Username:", username);
            window.location.href = './frontend/index.html';
            // Optionally handle the success response, e.g., redirect to another page
        })
        .catch(error => {
            console.error("Login failed.", error);
            // Optionally handle the failure response, e.g., display an error message to the user
        });
    });
});
