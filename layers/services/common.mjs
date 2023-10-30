import moment from 'moment';

export const nowTime = () => (moment().format());

export const is10MinElapsed = (time) => {
    const diff = moment().diff(moment(time), 'minutes', true);
    return diff > Math.abs(9.8);  //-> Capital.com session expires in 10 mins. Use 9.8 to account for aws services processing time
}
