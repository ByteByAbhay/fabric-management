import axios from 'axios';

// Use env override; default to Nginx reverse proxy path
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
console.log("🚀 ~ baseURL:", baseURL)

const instance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;