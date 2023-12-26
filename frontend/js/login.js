document.addEventListener("DOMContentLoaded", function () {
    var loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        var username = xssFilters.inHTMLData(document.getElementById('username').value);
        var password = xssFilters.inHTMLData(document.getElementById('password').value)

        if (!username || !password) {
            alert("Nejsou vyplněná všechna okna");
            return;
        }

        var loginData = {
            "username": username,
            "password": password
        };

        fetch("https://tomaschmelarapp-backend.onrender.com/login", {
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

            return response.json();
        })
        .then(data => {
            var token = data.token;
            var username = data.username;
        
            // Set the token and username as cookies with a 20-minute expiration time
            var expirationTime = new Date();
            expirationTime.setTime(expirationTime.getTime() + (20 * 60 * 1000)); // 20 minutes
        
            document.cookie = `token=${encodeURIComponent(token)}; expires=${expirationTime.toUTCString()}; path=/`;
        
            window.location.href = './list.html';
        })
        .catch(error => {
            document.getElementById('loginError').innerText = "Neplatné přihlašovací údaje";
        });
    });
});
