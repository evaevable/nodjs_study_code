const fs = require('fs').promises;

fs.readFile('files/file1.txt', 'utf8')
    .then(data1 => {
        console.log('Data from file1:', data1);
        return fs.readFile('files/file2.txt', 'utf8');
    })
    .then(data2 => {
        console.log('Data from file2:', data2);
        return fs.readFile('files/file3.txt', 'utf8');
    })
    .then(data3 => {
        console.log('Data from file3:', data3);
    })
    .catch(err => {
        console.error('Error reading files:', err);
    });

console.log("doing other...")