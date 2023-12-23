from flask import Flask, request, jsonify, Response, render_template, redirect, url_for
from flask_cors import CORS
import json
import jwt
import os


app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = os.environ.get('KEY')

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
    
    response = jsonify(data)
    response.headers['Content-Type'] = 'application/json'
    return response

@app.route('/users', methods=["POST"])
def users():
    if request.method == "POST":
        try:
            # Ověření a dekódování JWT tokenu
            token = request.headers.get('Authorization').split('Bearer ')[1]
            decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            username = decoded_token['username']

            received_data = request.get_json()
            print(f"Received data: {received_data}")

            # Vložení uživatelského jména z tokenu do záznamu
            new_record = {
                "text": received_data.get("text", ""),
                "user": username,
                "hotovo": 0
            }

            # Načtení existujících dat
            with open("tasks.json", "r") as f:
                data = json.load(f)

            # Přidání nového záznamu k existujícím datům
            data.append(new_record)

            # Uložení aktualizovaných dat zpět do souboru
            with open("tasks.json", "w") as f:
                json.dump(data, f, indent=2)

            return_data = {
                "status": "success",
                "message": f"Data added: {new_record}",
                "records": data  # Zahrnout aktualizovaný seznam záznamů do odpovědi
            }
            return jsonify(return_data), 201

        except jwt.ExpiredSignatureError:
            return jsonify({"status": "error", "message": "Token expiroval"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"status": "error", "message": "Neplatný token"}), 401
        
@app.route('/users/filtr/<token>', methods=["GET"])
def get_user_data(token):
    try:
        # Ověření a dekódování JWT tokenu
        print(token)
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = decoded_token['username']
        print(username)
        with open("tasks.json", "r") as f:
            data = json.load(f)

        # Filtrace záznamů podle uživatelského jména
        user_tasks = [task for task in data if task["user"] == username]

        return jsonify(user_tasks)

    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expiroval"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Neplatný token"}), 401
    
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

@app.route('/users/hotovo/<token>', methods=["GET"])
def hotovo(token):   
    try:
        # Ověření a dekódování JWT tokenu
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = decoded_token['username']

        with open("tasks.json", "r") as f:
            data = json.load(f)

        # Filtrace nehotových záznamů podle uživatelského jména
        completed_records = [record for record in data if record["user"] == username and record["hotovo"] == 1]

        return jsonify(completed_records)

    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expiroval"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Neplatný token"}), 401

@app.route('/users/nesplneno/<token>', methods=["GET"])
def nesplneno(token):
    try:
        # Ověření a dekódování JWT tokenu
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = decoded_token['username']

        with open("tasks.json", "r") as f:
            data = json.load(f)

        # Filtrace nehotových záznamů podle uživatelského jména
        uncompleted_records = [record for record in data if record["user"] == username and record["hotovo"] == 0]

        return jsonify(uncompleted_records)

    except jwt.ExpiredSignatureError:
        return jsonify({"status": "error", "message": "Token expiroval"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"status": "error", "message": "Neplatný token"}), 401

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
    app.run("0.0.0.0", 6969)
