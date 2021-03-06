import { withSnackbar, WithSnackbarProps } from 'notistack';
import { formatAmount } from 'lib/format-amount';
import { CCashCow } from 'types/ccashcow';
import { api } from 'lib/api';
import React from 'react';
import {
  createStyles,
  withStyles,
  Typography,
  WithStyles,
  Button,
  Paper
} from '@material-ui/core';

const styles = createStyles({
  main: {
    justifyContent: 'center',
    flexDirection: 'column',
    fontFamily: 'Roboto',
    display: 'flex',
    height: '100vh'
  },
  paper: {
    textAlign: 'center',
    minWidth: '21em',
    padding: '1em',
    margin: '0.5em auto'
  },
  title: {
    fontSize: '300%'
  },
  footer: {
    maxWidth: '20em',
    padding: '1em',
    margin: '0 auto'
  },
  buttons: {
    marginTop: '2em'
  },
  ccButton: {
    marginRight: '0.5em'
  }
});

interface PaymentState {
  payment?: CCashCow.Payment;
  jwt?: string;
}

interface PaymentProps extends WithStyles<typeof styles>, WithSnackbarProps {
  qs: { [x: string]: string };
}

class _Payment extends React.Component<PaymentProps, PaymentState> {
  interval?: NodeJS.Timer;
  state: PaymentState = {};

  componentDidMount() {
    const { jwt } = this.props.qs;
    if (!jwt) return location.replace(process.enve.APP_PAYMENT_URL);
    api
      .get('/payment', { params: { jwt } })
      .then(res => {
        const payment: CCashCow.Payment = res.data;
        this.setState({ payment, jwt });
        if (payment.paid) throw 'Payment already paid';
        if (payment.method) this.waitForPayment();
      })
      .catch(() =>
        location.replace(process.enve.APP_PAYMENT_URL.replace('{{JWT}}', jwt))
      );
  }

  onPay(paymentId: CCashCow.Payment['id'], method: CCashCow.PaymentMethod) {
    api
      .post(`/payment/${method}/start`, { paymentId })
      .then(res => location.replace(res.data.url))
      .catch(err => this.props.enqueueSnackbar(err.response.data.error));
  }

  waitForPayment() {
    const { method } = this.state.payment as CCashCow.Payment;
    this.interval = setInterval(
      () =>
        api
          .post(`/payment/${method}/finish`, this.props.qs)
          .then(res =>
            location.replace(
              process.enve.APP_PAYMENT_URL.replace('{{JWT}}', res.data.jwt)
            )
          )
          .catch(err => console.warn('waitForPayment()', err)),
      5000
    );
  }

  render() {
    const { payment, jwt } = this.state;
    const { classes } = this.props;
    if (!payment) return null;
    return (
      <main className={classes.main}>
        {payment.method === undefined ? (
          <Paper className={classes.paper} elevation={1}>
            <Typography variant="h1" className={classes.title}>
              {formatAmount(payment.amount * process.enve.CURRENCY_MODIFIER)}
            </Typography>
            <Typography>Select your payment method:</Typography>

            <div className={classes.buttons}>
              {payment.methods.indexOf('square') > -1 ? (
                <Button
                  className={classes.ccButton}
                  onClick={() => this.onPay(payment.id, 'square')}
                  variant="contained"
                  color="primary"
                >
                  Credit Card
                </Button>
              ) : null}
              {payment.methods.indexOf('coinbase-commerce') > -1 ? (
                <Button
                  onClick={() => this.onPay(payment.id, 'coinbase-commerce')}
                  variant="contained"
                  color="secondary"
                >
                  BTC / Other
                </Button>
              ) : null}
            </div>
          </Paper>
        ) : (
          <Paper className={classes.paper} elevation={1}>
            <Typography>
              Please wait while your payment is confirmed. Do not navigate away
              from this page unless your payment failed or cancelled.
            </Typography>
          </Paper>
        )}
        <footer className={classes.footer}>
          <Button
            href={process.enve.APP_PAYMENT_URL.replace(
              '{{JWT}}',
              jwt as string
            )}
            color="secondary"
          >
            Back to {process.enve.NAME}
          </Button>
        </footer>
      </main>
    );
  }
}

export const Payment = withSnackbar(withStyles(styles)(_Payment));
