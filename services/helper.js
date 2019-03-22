var helper = {};

helper.formatDate = function(date, type){
    var day = ~~date.getDate();
    var month = ~~date.getMonth() + 1;
    var year = date.getFullYear();
	if(type === "yyyy_MM_dd"){
	    return year + "_" + month + "_" + day;
    }else if(type === "dd/MM"){
    	return day + "/" + month;
    }
}

helper.random = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

helper.phoneNumber = function(phone) {
    if (!phone) {
        return false;
    }

    phone = (phone + "").replace(/\D+/g, '');
    phone = phone.indexOf('84') == 0 ? phone.replace('84', '0') : phone;
    phone = (phone.indexOf('0') != 0 ? '0' : '') + phone;

    /*
    let l = phone.length;
    let is09 = phone.indexOf('09') == 0;
    let is01 = phone.indexOf('01') == 0;

    if ((!is09 && !is01) || (is09 && l != 10) || (is01 && l != 11)) {
        return false;
    }
    */

    if (phone.length < 10) {
        return null;
    }

    return phone;
};

helper.isValidName = function(name) {
    if (name === undefined || name === null || name === '') {
        return false;
    }

    return (name + '').length <= 40;
};

module.exports = helper;
