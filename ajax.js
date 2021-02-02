

//an ajax comand is the data to send to the server
//  just header information
//
//element_target is a set of elements
//  assign events as a group
//  collect feild data as a group
//  
//
//response handeler a list of effects that will occure
//      before
//      sucesss
//      error
//      complete
//
//prebuilt ajax commands
//
//prebuilt response handeler
//handels what happend with the ruturn data
//what do you expect to d

function ajax_package(debug_val) {

    valid_mehtod = ['GET', 'POST'];
    valid_dataType = ["json", "html", 'text'];
    valid_contentType = ['application/json'];
    valid_event = ['click', "change", "load"];
    debug = debug_val;

    var default_before = function (html_event, request) {
        console.debug(["before", html_event, request]);
        return null;
    }
    function set_default_before(func = default_before) {
        default_before = func
    }
    var default_success = function (data) {
        console.debug(["success", data])
    }

    function set_default_success(func = default_success) {
        default_success = func
    }
    var default_error = function (request, textStatus, errorThrown) {
        console.debug(["error: " + textStatus, errorThrown, request]);
    }
    function set_default_error(func = default_error) {
        default_error = func
    }


    var default_complete = function (request, status) {
        console.debug(["complete:" + String(status), request]);
    }
    function set_default_complete(func = default_complete) {
        default_complete = func
    }


    function in_list(target, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] == target) {
                return true
            }
        }
        console.warn("invalid: \"" + String(target) + "\" not in " + String(list))
        return false
    }

    //handels the actions the java script on the web site needs to do
    class ajax_handeler {
        constructor(
            dataType = "json",
            success = default_success,
            error = default_error,
            before = default_before,
            complete = default_complete) {

            this.dataType = dataType;
            this.before = before;//before funciton allows you to tirgger a start loading
            this.success = success;//complete function allwos you to tigger a stop loading
            this.error = error;//the error method is used to tell the user there was a prolem/debugging
            this.complete = complete;//the sucess does the action we planed on doing
        }

        validate() {
            return in_list(this.dataType, valid_dataType)
        }
        stringify() {
            return "ajax_handeler: " + this.dataType
        }

    }

    //handels the sending of data back to the server
    class ajax_command {
        constructor(url, data = {}, method = 'GET', contentType = "application/json") {
            this.url = url//where are you going to send the data url
            this.data = data//a base data object or function that will be called just before the running of the ajax call
            this.method = method//the method to be used
            this.contentType = contentType//the content type of the message
        }
        validate() {
            return in_list(this.method, valid_mehtod) && in_list(this.contentType, valid_contentType)
        }
        stringify() {
            return "ajax_command: " + String(this.method) + "@" + String(this.url) + " using " + String(this.contentType)
        }
        get_data(html_event) {//if data is a function we should run it if this is not a function we should copy the stuff
            if (this.data instanceof Function) {
                return this.data(html_event)
            } else {
                var data_copy = JSON.parse(JSON.stringify(this.data))
                data_copy.html_event = html_event
                return data_copy
            }
        }
    };

    //sets up the listener on the html events
    class ajax_runner {
        constructor(
            element_target_obj = new element_target(),//who will start this command
            event = 'click'//what triggers the start of the event  
        ) {
            this.element_target_obj = new element_target(element_target_obj)
            this.event = event
        }
        validate() {
            return in_list(this.event, valid_event) && this.element_target_obj.constructor.name == "element_target"
        }
        stringify() {
            return "ajax_runner: " + this.event
        }
    };

    function idenifier(element) {
        if (typeof element.name == "string") {
            return element.name
        } else if (typeof element.id == "string") {
            returnelement.id
        } else if (typeof element.tagName == "string") {
            returnelement.tagName
        }
        return null
    }

    function evaluate(element) {
        if (typeof element.value != null) {
            return element.value
        } else if (typeof element.content != null) {
            return element.content
        } else if (typeof element.innerHTML != null) {
            return element.innerHTML
        }
        return null
    }

    function set_values(element, value) {
        if (typeof element.value != null) {
            element.value = value
        } else if (typeof element.content != null) {
            return element.content
        } else if (typeof element.innerHTML != null) {
            return element.innerHTML
        }

    }

    //group elements to be selected and the event to apply
    class element_target {
        constructor(...value) {
            this.value_orig = value//this is a value that will be used to link things 
            //options css selector  dom element list dom element list of mixed items 
            this.value = Array()
            this.value = this.value.concat(value)
            this.value = this.value.flat()

        }
        for_each_element(func = function (elem) { console.log(elem); }) {
            for (var i = 0; i < this.value.length; i++) {
                //console.log(this.value[i])

                if (typeof this.value[i] == "string") {

                    let targeted_elements = document.querySelectorAll(this.value[i])
                    //console.log(targeted_elements[0])
                    for (var ii = 0; ii < targeted_elements.length; ii++) {
                        func(targeted_elements[ii])
                    }
                } else if (this.value[i].constructor != null && this.value[i].constructor.name == "element_target") {
                    this.value[i].for_each_element(func)
                } else if (this.value[i].constructor != null && this.value[i].constructor.name == "HTMLCollection") {
                    for (var ii = 0; ii < this.value[i].length; ii++) {
                        func(this.value[i][ii])
                    }
                } else {
                    func(this.value[i])
                }

            }
        }
        add_listener(event, func) {
            this.for_each_element(function (element) {
                // console.log(element)
                // console.log(event)
                element.addEventListener(event, func);
            })
        }


    };


    //link function takes one of each item and setsup the ajax commadand
    function link_ajax(ajax_runner_obj, ajax_command_obj, ajax_handeler_obj = new ajax_handeler()) {
        console.debug("linking")
        if (ajax_runner_obj.validate() &&
            ajax_command_obj.validate() &&
            ajax_handeler_obj.validate()) {//all is valid

            ajax_runner_obj.element_target_obj.add_listener(
                ajax_runner_obj.event,
                function (html_event) {

                    var request = new XMLHttpRequest();

                    request.open(ajax_command_obj.method, ajax_command_obj.url)
                    request.setRequestHeader("Content-Type", ajax_command_obj.contentType)

                    before_process = ajax_handeler_obj.before(html_event, request)//run the before function and capture return
                    data = ajax_command_obj.get_data(html_event)//get the data by the ajax command
                    data.before_return = before_process


                    if (debug) {
                        console.log("ajax\n" + ajax_runner_obj.stringify() + "\n" + ajax_command_obj.stringify() + "\n" + ajax_handeler_obj.stringify())
                        console.log(data)
                    }
                    request.onload = function () {
                        var complete_msg = "success"
                        if (request.status == 200) {
                            return_data = null
                            if (ajax_handeler_obj.dataType == "json") {
                                return_data = JSON.parse(request.responseText);
                            } else if (ajax_handeler_obj.dataType == 'html') {
                                return_data = request.responseText;
                            } else {
                                return_data = request.responseText;
                            }
                            ajax_handeler_obj.success(return_data)
                        }
                        else {
                            ajax_handeler_obj.error(request, string(request.status), "error")
                            complete_msg = "error"
                            if (debug) {
                                alert("error in ajax")
                            }
                        }
                        ajax_handeler_obj.complete(request, complete_msg)
                    }

                    if (ajax_command_obj.contentType == 'application/json') {
                        request.send(JSON.stringify(data));
                    } else {
                        request.send(str(data));
                    }

                }
            )

        } else {
            console.log("invalid_ajax")
            console.log(ajax_runner_obj.stringify())
            console.log(ajax_command_obj.stringify())
            console.log(ajax_handeler_obj.stringify())
        }

    }


    function ajax_run(ajax_command_obj, ajax_handeler_obj = new ajax_handeler()) {
        if (ajax_command_obj.validate() &&
            ajax_handeler_obj.validate()) {//all is valid

            var request = new XMLHttpRequest();

            request.open(ajax_command_obj.method, ajax_command_obj.url)
            request.setRequestHeader("Content-Type", ajax_command_obj.contentType)

            before_process = ajax_handeler_obj.before({}, request)//run the before function and capture return
            data = ajax_command_obj.get_data({})//get the data by the ajax command
            data.before_return = before_process


            if (debug) {
                console.log("ajax\n" + ajax_command_obj.stringify() + "\n" + ajax_handeler_obj.stringify())
                console.log(data)
            }
            request.onload = function () {
                var complete_msg = "success"
                if (request.status == 200) {
                    return_data = null
                    if (ajax_handeler_obj.dataType == "json") {
                        return_data = JSON.parse(request.responseText);
                    } else if (ajax_handeler_obj.dataType == 'html') {
                        return_data = request.responseText;
                    } else {
                        return_data = request.responseText;
                    }
                    ajax_handeler_obj.success(return_data)
                }
                else {
                    ajax_handeler_obj.error(request, string(request.status), "error")
                    complete_msg = "error"
                    if (debug) {
                        alert("error in ajax")
                    }
                }
                ajax_handeler_obj.complete(request, complete_msg)
            }

            if (ajax_command_obj.contentType == 'application/json') {
                request.send(JSON.stringify(data));
            } else {
                request.send(str(data));
            }




        } else {
            console.log("invalid_ajax")
            console.log(ajax_command_obj.stringify())
            console.log(ajax_handeler_obj.stringify())
        }
    }

    //constant functions


    //ajax_runner builds
    //event_list https://developer.mozilla.org/en-US/docs/Web/Events
    function ON_CHANGE(element) { return new ajax_runner(element, 'change') }
    function ON_CLICK(element) { return new ajax_runner(element, 'click') }
    function ON_MOUSEOVER(element) { return new ajax_runner(element, 'mouseover') }
    function ON_MOUSEOUT(element) { return new ajax_runner(element, 'mouseout',) }
    function ON_MOUSEDOWN(element) { return new ajax_runner(element, 'mousedown') }
    function ON_MOUSEUP(element) { return new ajax_runner(element, 'mouseup') }
    function ON_KEYDOWN(element) { return new ajax_runner(element, 'keydown') }
    function ON_KEYUP(element) { return new ajax_runner(element, 'keypress') }
    function ON_KEYPRESS(element) { return new ajax_runner(element, 'keyup') }
    function ON_FOCUS(element) { return new ajax_runner(element, 'focus') }
    function ON_BLUR(element) { return new ajax_runner(element, 'blur') }
    function ON_PREFOCUS(element) { return new ajax_runner(element, 'focusin') }
    function ON_PREBLUE(element) { return new ajax_runner(element, 'focusout') }


    function query(...value) {
        args = Array()
        args = args.concat(value)
        return new element_target(args)
    }


    //ajax_commands
    function GET_JSON(url, data) { return new ajax_command(url, data, "GET", "application/json") }
    function POST_JSON(url, data) { return new ajax_command(url, data, "GET", "application/json") }

    //ajax_data_functions
    function FIELD_DICT(element) {
        var targets = new element_target(element)
        return function () {
            var result = new Object()
            targets.for_each_element(function (element) {
                key = idenifier(element)
                value = evaluate(element)
                result[key] = value
            })
            return result
        }
    }
    function FIELD_LIST(element) {
        var targets = new element_target(element)
        return function () {
            var result = []
            targets.for_each_element(function (element) {
                value = evaluate(element)
                result.push(value)
            })
            return result
        }
    }


    //ajax_handelers
    function RECIVE_JSON(success, error, before, complete) {
        return new ajax_handeler("json", success, error, before, complete)
    }
    function RECIVE_HTML(success, error, before, complete) {
        return new ajax_handeler("html", success, error, before, complete)
    }
    function RECIVE_TEXT(success, error, before, complete) {
        return new ajax_handeler("text", success, error, before, complete)
    }

    function REPLACE_HTML(element, error, before, complete) {

        let targets = new element_target(element)
        return RECIVE_HTML(function (data) {
            targets.for_each_element(function (element) {
                element.innerHTML = data

            })
        }, error, before, complete)
    }

    function SEND_ALERT_MESSAGE(error, before, complete) {
        return RECIVE_TEXT(function (data) { alert(data) }, error, before, complete)
    }
    function SET_FIELDS(elements, error, before, complete) {
        let targets = new element_target(elements)
        return RECIVE_JSON(function (data) {
            targets.for_each_element(function (element) {
                key = idenifier(element)
                if (data[key] != null) {
                    set_values(element, data[key])
                }
                element.innerHTML = data
            })
        }, error, before, complete)
    }




    return {
        classes: {
            ajax_command: function (
                url, data, method, contentType) {
                return new ajax_command(url, data, method, contentType)
            },
            ajax_handeler: function (
                dataType,
                before,
                success,
                error,
                complete
            ) {
                return new ajax_handeler(dataType, success, error, before, complete);
            },
            ajax_runner: function (
                element_target_obj,
                event
            ) {
                return new ajax_runner(element_target_obj, event)
            },
            element_target: function (...value) {
                return new element_target(value)
            }
        },
        //
        // ajax_runner, ajax_command, ajax_handeler
        "link_ajax": link_ajax,
        //ajax_command, ajax_handeler
        "ajax_run":ajax_run,
        //-> ajax_runner
        runner: { // elements : qurry_set or single string or single html collection
            "ON_CHANGE": ON_CHANGE,
            "ON_CLICK": ON_CLICK,
            "ON_MOUSEOVER": ON_MOUSEOVER,
            "ON_MOUSEOUT": ON_MOUSEOUT,
            "ON_MOUSEDOWN": ON_MOUSEDOWN,
            "ON_MOUSEUP": ON_MOUSEUP,
            "ON_KEYDOWN": ON_KEYDOWN,
            "ON_KEYUP": ON_KEYUP,
            "ON_KEYPRESS": ON_KEYPRESS,
            "ON_FOCUS": ON_FOCUS,
            "ON_BLUR": ON_BLUR,
            "ON_PREFOCUS": ON_PREFOCUS,
            "ON_PREBLUE": ON_PREBLUE
        },
        //-> ajax_command
        command: { // url : string, data: function(html_event)->object or object
            "GET_JSON": GET_JSON,
            "POST_JSON": POST_JSON
        },
        // -> object
        data_function: {// elements : qurry_set or single string or single html collection 
            "FIELD_DICT": FIELD_DICT,
            "FIELD_LIST": FIELD_LIST
        },
        // -> ajax_handeler
        handeler: {
            //success :function(data), error :function(request, textStatus, errorThrown), before :function(html_event, request), complete :function(request, status)
            "RECIVE_JSON": RECIVE_JSON,
            "RECIVE_HTML": RECIVE_HTML,
            "RECIVE_TEXT": RECIVE_TEXT,

            // elements : qurry_set or single string or single html collection,
            // error :function(request, textStatus, errorThrown), before :function(html_event, request), complete :function(request, status)        
            "REPLACE_HTML": REPLACE_HTML,
            "SET_FIELDS": SET_FIELDS,
            //error :function(request, textStatus, errorThrown), before :function(html_event, request), complete :function(request, status)
            "SEND_ALERT_MESSAGE": SEND_ALERT_MESSAGE,

        },
        //any number of query set,string,html collections -> qurrey set
        "query": query,

        defaults: {
            //  func :function(html_event, request)
            "set_default_before": set_default_before,
            //  func: function(data)
            "set_default_success": set_default_success,
            //  func :function(request, textStatus, errorThrown)
            "set_default_error": set_default_error,
            //  func :function(request, status)
            "set_default_complete": set_default_complete
        }
    }


}