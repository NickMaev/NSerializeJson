function init() {
    var elForm = document.getElementById("myForm");
    var elOutput = document.getElementById("output");
    serializeToOutput(elForm, elOutput);
    elForm
        .querySelectorAll("input, select, textarea")
        .forEach(function(el) {
            el.addEventListener("change",
                function(e) {
                    e.preventDefault(); 
                    serializeToOutput(elForm, elOutput);
                });
        });

}

function serializeToOutput(elForm, elOutput) {
    var jsonObject = NSerializeJson.NSerializeJson.serializeForm(elForm);
    elOutput.value = JSON.stringify(jsonObject, null, "\t");
}