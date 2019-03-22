$(document).ready(function() {
    $('#navbar .item.launch').click(function() {
        $('#sidebar').sidebar('toggle');
    });

    $('#login form').form({
        on: 'blur',
        fields: {
            username: {
                identifier: 'username',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a username'
                }]
            },
            password: {
                identifier: 'password',
                rules: [{
                    type: 'empty',
                    prompt: 'Please enter a password'
                }]
            }
        }
    });

    $('.ui.calendar').calendar({
        type: 'date',
        text: {
            days: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            months: ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'],
            monthsShort: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            today: 'Today',
            now: 'Now',
            am: 'AM',
            pm: 'PM'
        },
        className: {
            disabledCell: 'gray',
        },
        formatter: {
            date: function(date, settings) {
                let month = date.getMonth() + 1;
                let day = date.getDate();
                return date.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
            }
        }
    });

    // bind chart
    if (typeof chartData != 'undefined') {
        var failure = chartData.booking_failure;
        // var allTracking = chartData.all_tracking;

        var percent = function(v1, v2) {
            let round = parseInt(v1 * 10000 / v2);
            let dec = round % 100;
            let int = parseInt(round / 100);
            return (int == 0 && dec == 0 ? '0' : (int + '.' + (dec < 10 ? '0' : '') + dec));
        };

        window.chartColors = {
            black: '#000000',
            orange: 'rgb(255, 159, 64)',
            yellow: 'rgb(255, 205, 86)',
            green: 'rgb(75, 192, 192)',
            blue: 'rgb(54, 162, 235)',
            purple: 'rgb(153, 102, 255)',
            grey: 'rgb(201, 203, 207)',
            indigo: '#3F51B5',
            lime: '#CDDC39',
            teal: '#009688',
            red:'#F44336',
            pink_900:'#880E4F',
            purple_900:'#4A148C'


        };

        var config = {
            type: 'pie',
            data: {
                datasets: [{
                    data: [
                        percent(chartData.stop_at_start, failure),
                        percent(chartData.stop_at_chat_staff, failure),
                        percent(chartData.stop_at_phone, failure),
                        percent(chartData.stop_at_enter_verify_code, failure),
                        percent(chartData.stop_at_select_service, failure),
                        percent(chartData.stop_at_confirm_cancle_booking, failure),
                        percent(chartData.stop_at_confirm_overwrite_booking, failure),
                        percent(chartData.stop_at_area, failure),
                        percent(chartData.stop_at_salon, failure),
                        percent(chartData.stop_at_date, failure),
                        percent(chartData.stop_at_stylist, failure),
                        percent(chartData.stop_at_period_time, failure),
                        percent(chartData.stop_at_time, failure),
                    ],
                    backgroundColor: [
                        window.chartColors.grey,
                        window.chartColors.orange,
                        window.chartColors.yellow,
                        window.chartColors.green,
                        window.chartColors.blue,
                        window.chartColors.purple,
                        window.chartColors.black,
                        window.chartColors.indigo,
                        window.chartColors.lime,
                        window.chartColors.teal,
                        window.chartColors.red,
                        window.chartColors.pink_900,
                        window.chartColors.purple_900,
                    ],
                    label: 'Dataset 1'
                }],
                labels: [
                    "Start",
                    "Chat với tư vấn",
                    "Nhập SĐT",
                    "Nhập mã xác thực",
                    "Chọn dịch vụ",
                    "Chọn hủy lịch",
                    "Chọn ghi đè lịch",
                    "Chọn khu vực",
                    "Chọn salon",
                    "Chọn ngày",
                    "Chọn Stylist",
                    "Chọn khoảng thời gian",
                    "Chọn giờ"
                ]
            },
            options: {
                responsive: true
            }
        };

        var ctx = document.getElementById("chartjs").getContext("2d");
        window.myPie = new Chart(ctx, config);
    }
});