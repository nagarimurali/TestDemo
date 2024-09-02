function initializeDropdown(dropdownSelector, selectAllSelector, checkboxesSelector, selectTextSelector) {
    $(selectAllSelector).click(function () {
        if ($(this).is(':checked')) {
            $(checkboxesSelector).prop('checked', true);
            const total = $(checkboxesSelector).length;
            $(selectTextSelector).html(`${total} Selected`);
        } else {
            $(checkboxesSelector).prop('checked', false);
            $(selectTextSelector).html('Select');
        }
        updateSelectedValues();
    });

    $(checkboxesSelector).change(function () {
        const checkedCount = $(`${checkboxesSelector}:checked`).length;
        const totalCount = $(checkboxesSelector).length;
        if (checkedCount === totalCount) {
            $(selectAllSelector).prop('checked', true);
            $(selectTextSelector).html(`${checkedCount} Selected`);
        } else {
            $(selectAllSelector).prop('checked', false);
            $(selectTextSelector).html(`${checkedCount ? `${checkedCount} Selected` : 'Select'}`);
        }
        updateSelectedValues();
    });

    function updateSelectedValues() {
        const selectedValues = [];
        $(`${checkboxesSelector}:checked`).each(function () {
            selectedValues.push($(this).val().trim());
        });
        console.log(`Selected values for ${dropdownSelector}: `, selectedValues);
    }
}

// Initialize dropdowns
$(document).ready(function () {
    initializeDropdown('#dropdown1', '#selectall1', 'input[name="options1[]"]', '#select-text1');
    initializeDropdown('#dropdown2', '#selectall2', 'input[name="options2[]"]', '#select-text2');
    initializeDropdown('#dropdown3', '#selectall3', 'input[name="options3[]"]', '#select-text3');
});
