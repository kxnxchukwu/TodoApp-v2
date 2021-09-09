const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemSchema);

const meditate = new Item({
    name: "5 Minutes Meditation."
});

const coding = new Item({
    name: "Practice your coding skills!"
});

const binge = new Item({
    name: "Binge watch your favourite shows!!!"
});

const defaultItems = [meditate, coding, binge]

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);



app.get('/', function (req, res){
    Item.find(function (err, foundItems){
        
        if (foundItems.length === 0) {
             Item.insertMany(defaultItems, function (err) {
                 if (err) {
                     console.log(err);
                    }
                else {
                    console.log("Successfully saved all the items to the todolistDB!");
                    }
                });
            res.redirect("/");
        }
        else {
            res.render('list', {listTitle : "Today", newListItem : foundItems});
        }
    });
    
});


app.post('/', function (req, res){
    const itemName = req.body.nextitem;
    const listTitle = req.body.listTitle;
    
    const item = new Item({
        name: itemName
    });

    if (listTitle === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({name: listTitle}, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" +listTitle);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemID = req.body.checkbox;
    const listTitle = req.body.listTitle;

    if (listTitle === "Today") {
        Item.findByIdAndRemove(checkedItemID, function(err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Item Deleted Successfully!");
                res.redirect("/");
            }
        });
    }
    else {
        List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemID}}}, function (err, foundItems) {
            if (!err) {
                res.redirect("/"+listTitle);
            }
        });
    }
});

app.get("/:route", function (req, res) {
    const route = _.capitalize(req.params.route);

    List.findOne({name: route}, function (err, result) {
        if (!err){
            if (!result) {
                const list = new List({
                    name: route,
                    items: defaultItems
                });
            
                list.save();

                res.redirect("/" + route);
            }
            else {
                res.render('list', {listTitle : result.name, newListItem : result.items});
            }
        }
    });
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on Port 3000")
});
