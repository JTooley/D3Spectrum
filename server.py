from flask import Flask
app = Flask(__name__)


@app.route('/spectrum')
def spectrum():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run()