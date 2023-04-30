# Mongodb Notes

## how to login to and use mongosh

login command

    mongosh "mongodb+srv://cluster0.rw6lv.mongodb.net/studentsdb" --username web4200 --password krOnbLZkxjXG6fAk

insert into database object

    db.students.insertOne({ name: 'james', grade: 8})

print database object

    db.students.find()

search database object and print corresponding data

    db.students.find({ grade:8 })

will find all students with 'dog' in their name

    db.students.find({ name: { $regex: 'dog' }})

## mongoose

```js
const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://web4200:krOnbLZkxjXG6fAk@cluster0.rw6lv.mongodb.net/studentsdb?retryWrites=true&w=majority");
});
```
