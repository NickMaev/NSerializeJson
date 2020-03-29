function serializeToOutput(elForm, useDotSeparatorInPath, elOutput) {
    var jsonObject = NSerializeJson.NSerializeJson.serializeForm(elForm, { useDotSeparatorInPath });
    elOutput.value = JSON.stringify(jsonObject, null, "\t");
}

function init() {

    // Braket separator.

    var inputElementNames = "input, select, textarea";

    var elForm = document.getElementById("myForm");
    var elOutput = document.getElementById("output");
    serializeToOutput(elForm, false, elOutput);
    elForm
        .querySelectorAll(inputElementNames)
        .forEach(function (el) {
            el.addEventListener("change",
                function (e) {
                    e.preventDefault();
                    serializeToOutput(elForm, false, elOutput);
                });
        });

    // Dot separator.

    var elFormWithDot = document.getElementById("myForm_dot");
    var elOutputWithDot = document.getElementById("output_dot");

    serializeToOutput(elFormWithDot, true, elOutputWithDot);

    elFormWithDot
        .querySelectorAll(inputElementNames)
        .forEach(function (el) {
            el.addEventListener("change",
                function (e) {
                    e.preventDefault();
                    serializeToOutput(elFormWithDot, true, elOutputWithDot);
                });
        });
}