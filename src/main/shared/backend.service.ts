const nodeFetch = require("node-fetch");

function get(path, header) {
    return nodeFetch(path, {
        method: "GET",
        cache: "no-cache",
        headers: header,
    });
}

function put(path, header, body) {
    return nodeFetch(path, {
        method: "PUT",
        cache: "no-cache",
        headers: header,
        body: JSON.stringify(body),
    });
}

function post(path, header, body) {
    return nodeFetch(path, {
        method: "POST",
        cache: "no-cache",
        headers: header,
        body: JSON.stringify(body),
    });
}



module.exports = {
    get,
    put,
    post
};
