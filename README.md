# ITIM Online

A web frontend for [my ITIM Go program](https://github.com/BluAtlas/ITIM) using VueJs and Express.

## Hosting

ITIM.exe and ./ITIM can be compiled from [https://github.com/BluAtlas/ITIM](https://github.com/BluAtlas/ITIM)

Place app icon PNG files inside a folder called `icons`.

Change the server and database URL's at the top of `model.js` and `public/app.js`.

Then run using NodeJs with:

```shell
npm install .
node index.js
```

## Resources

### Template Resource

Attributes:

```go
- name (string)
- phone_size_x (int)
- phone_size_y (int)
- app_size (int)
- from_top (int)
- from_left (int)
- between_x (int)
- between_y (int)
- from_bottom (int)
- from_left_dock (int)
- max_apps (int)
- dock_count (int)
```

---

### Job Resource

Attributes:

```go
- templateId (int)
- jobId (int)
```

## REST Endpoints

Name                            | Method   | Path
--------------------------------|----------|------------------
Get template collection         | `GET` | `/iphonetemplates`
Get template member             | `GET` | `/iphonetemplates/{templateId}`
Post template member            | `POST` | `/iphonetemplates`
Replace template member         | `PUT` | `/iphonetemplates/{templateId}`
Delete template member          | `DELETE` | `/iphonetemplates/{templateId}`
Download zip file from job      | `GET` | `/{jobId}/download`
Handle and run new job          | `POST` | `/jobs/{templateId}`
