const logger = require('./logger');

exports.notifyTicketResolved = async (ticket, user) => {
    logger.info([NOTIFICATION] Email sent to ${user.email}: Ticket #${ticket.id} çözüldü.);
};

exports.notifyCommentAdded = async (ticket, user, comment) => {
    logger.info([NOTIFICATION] Email sent to ${user.email}: Ticket #${ticket.id} yeni yorum var.);
};
