package main

import (
  "net/http"
  "encoding/json"
  "io/ioutil"
  "log"
)

type Options struct {
  Path string
  Port string
}

type Category struct {
  Name string
  Count int
}

//define global map
var categories = make(map[string]Category)

func categoriesHandler(w http.ResponseWriter, req *http.Request) {
      switch req.Method {
      case "GET":
      buf, err := json.Marshal(&categories)
        if err != nil {
          log.Println(err)
        }
      w.Write(buf)
      case "PUT":
      buf, err := ioutil.ReadAll(req.Body)
        if err != nil {
          log.Println(err)
        }
      json.Unmarshal(buf, &categories)
      default:
      w.WriteHeader(400)
      }
}

func categoryHandler(w http.ResponseWriter, req *http.Request) {
  var resource = req.RequestURI
  switch req.Method {
    case "GET":
    buf, err := json.Marshal(categories[resource])
    if err != nil {
      log.Println("JSON Marshal error: ")
      log.Println(err)
    }
    w.Write(buf)
    case "PUT":
    var newCategory Category
    buf, err := ioutil.ReadAll(req.Body)
    if err != nil {
      log.Println(err)
    }
    json.Unmarshal(buf, &newCategory)
    categories[resource] = newCategory
    default:
    w.WriteHeader(400)
  }
}

func main() {

  // set default options
  op := &Options{Path: "./", Port: "8004"}

  // read config file into memory
  data, jsonErr := ioutil.ReadFile("./config.json")
  if jsonErr != nil {
    log.Println("JSONReadFileError: ", jsonErr) 
  }
  
  // parse config file, store results in "op"
  json.Unmarshal(data, op)
  log.Println("Parsed options from config file: ", op)
  
  //fill categories map
  categories["/categories/colors"] = Category{"Colors", 0}
  categories["/categories/animals"] = Category{"Animals", 0}
  categories["/categories/utensils"] = Category{"Kitchen Utensils", 0}
  categories["/categories/shoes"] = Category{"Shoe Brands", 0}
  categories["/categories/books"] = Category{"Book Titles", 0}
  categories["/categories/comics"] = Category{"Comic Book Characters", 0}
 
  
  //handle root directory
  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	    log.Println(r.RemoteAddr)
      http.FileServer(http.Dir(op.Path)).ServeHTTP(w, r)
  })
  
  //handle category collection
  http.HandleFunc("/categories", categoriesHandler)
  http.HandleFunc("/categories/", categoryHandler)
 
  
  err := http.ListenAndServe(":" + op.Port, nil)
  if err != nil {
    log.Fatal("ListenAndServe: ", err)
  }
}