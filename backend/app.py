from flask import Flask, request, jsonify, Response, render_template, redirect, url_for
from flask_cors import CORS
import json
import jwt


app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = 'secret'

# Define a decorator to check for authentication before each request
def authenticate(func):
    def wrapper(*args, **kwargs):
        token = request.cookies.get('token')

        if token:
            try:
                # Decode the token
                decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                # Attach the decoded payload to the request object
                request.user = decoded_token
                return func(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                # Token has expired
                return jsonify({"status": "error", "message": "Token has expired"}), 401
            except jwt.InvalidTokenError:
                # Invalid token
                return jsonify({"status": "error", "message": "Invalid token"}), 401
        else:
            # No token found in the request
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

    return wrapper

@app.route('/usersjson', methods=["GET"])
def get_users_datas():
    with open("tasks.json", "r") as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/users', methods=["POST"])
def users():

    if request.method == "POST":
        received_data = request.get_json()
        print(f"received data: {received_data}")

        # Get the username from the request or set a default value if not present
        username = received_data.get("user", "default_username")

        # Create a new record with the specified structure including the username
        new_record = {
            "text": received_data.get("text", ""),
            "user": username,
            "hotovo": 0
        }

        # Load existing data
        with open("tasks.json", "r") as f:
            data = json.load(f)

        # Append the new record to the existing data
        data.append(new_record)

        # Save the updated data back to the file
        with open("tasks.json", "w") as f:
            json.dump(data, f, indent=2)

        return_data = {
            "status": "success",
            "message": f"Data added: {new_record}",
            "records": data  # Include the updated list of records in the response
        }
        return jsonify(return_data), 201

@app.route('/users/filtr/<username>', methods=["GET"])
def get_user_data(username):
    with open("tasks.json", "r") as f:
        data = json.load(f)
    user_tasks = [task for task in data if task["user"] == username]
    return jsonify(user_tasks)

@app.route('/users/hotovo/<text>', methods=["PUT"])
def update_hotovo(text):
    print(f"Update hotovo endpoint reached for '{text}'...")
    with open("tasks.json", "r") as f:
        data = json.load(f)

    # Find the record with the specified 'text'
    for record in data:
        if record["text"] == text:
            # Update 'hotovo' to 1
            record["hotovo"] = 1
            break

    # Save the updated data back to the file
    with open("tasks.json", "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({"status": "success", "message": f"Record '{text}' marked as done."})

@app.route('/users/text/<text>', methods=["PUT"])
def update_text(text):
    print(f"Update text endpoint reached for '{text}'...")
    with open("tasks.json", "r") as f:
        data = json.load(f)

    # Find the record with the specified 'text'
    for record in data:
        if record["text"] == text:
            # Get the new text from the request
            new_text = request.get_json().get("newText", "")
            # Update 'text'
            record["text"] = new_text
            break

    # Save the updated data back to the file
    with open("tasks.json", "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({"status": "success", "message": f"Record '{text}' updated."})

@app.route('/users/smazat/<text>', methods=["DELETE"])
def delete_record(text):
    print(f"Delete record endpoint reached for '{text}'...")
    with open("tasks.json", "r") as f:
        data = json.load(f)

    # Find the record with the specified 'text' and remove it
    data = [record for record in data if record["text"] != text]

    # Save the updated data back to the file
    with open("tasks.json", "w") as f:
        json.dump(data, f, indent=2)

    return jsonify({"status": "success", "message": f"Record '{text}' deleted."})

@app.route('/users/hotovo/<username>', methods=["GET"])
def hotovo(username):
    print("hotovo endpoint reached...")
    with open("tasks.json", "r") as f:
        data = json.load(f)
    data_user = [task for task in data if task["user"] == username]
    # Filter records with 'hotovo' equal to 1
    completed_records = [record for record in data_user if record["hotovo"] == 1]

    return jsonify(completed_records)

@app.route('/users/nesplneno/<username>', methods=["GET"])
def nesplneno(username):
    print("nesplneno endpoint reached...")
    with open("tasks.json", "r") as f:
        data = json.load(f)
    data_user = [task for task in data if task["user"] == username]
    # Filter records with 'hotovo' equal to 0
    uncompleted_records = [record for record in data_user if record["hotovo"] == 0]

    return jsonify(uncompleted_records)

@app.route('/login', methods=["POST"])
def login():
    print("login endpoint reached...")
    with open("users.json", "r") as user_file:
        users = json.load(user_file)
    received_data = request.get_json()

    # Get username and password from received data
    username = received_data.get("username", "")
    password = received_data.get("password", "")
    # Authenticate users based on data from users.json
    for user in users:
        if user["username"] == username and user["password"] == password:
            # Generate a JWT token
            token = jwt.encode({'username': username}, app.config['SECRET_KEY'], algorithm='HS256')

            # Return token and username in the JSON response
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "token": token,
                "username": username
            })

    return jsonify({"status": "error", "message": "Invalid credentials"}), 401  # Unauthorized

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == "__main__":
    app.run("localhost", 6969)
