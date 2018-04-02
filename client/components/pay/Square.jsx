import request from 'superagent';
import React from 'react';

// Constants
import { SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID } from 'constants/config';

// Components
import CardForm from 'components/pay/SquareCardForm';

export default class PayWithSquare extends React.Component {

  constructor(props) {
    super(props);
  }

  /**
   * @param {string} nonce
   * @param {object} card
   */
  onPay(nonce, card) {
    const {Embed} = this.props;
    const {id} = Embed.state.payment;

    request
      .post(`/api/payments/${id}/square`)
      .send({
        nonce,
        postal: card.billing_postal_code,
        country: this._Country.value,
        address: this._Address.value
      })
      .end((err, res) => {
        if (err)
          Embed.onError(res.body.message);
        else
          Embed.onSuccess();
      });
  }

  /** @param {SquareError[]} e */
  /**
   * @typedef {object} SquareError
   * @prop {string} type
   * @prop {string} message
   * @prop {string} field
   */
  onPayError(e) {
    this.props.Embed.onError(e.map(_e => _e.message));
  }

  render() {
    return (
      <section className='pay-with-square'>
        <input
          ref={i => this._Country = i}
          type='text'
          placeholder='Country (US/UK/CA/etc)'
        />
        <input
          ref={i => this._Address = i}
          type='text'
          placeholder='Address'
        />

        <CardForm
          onPay={(n, c) => this.onPay(n, c)}
          onPayError={e => this.onPayError(e)}
        />
      </section>
    );
  }

}