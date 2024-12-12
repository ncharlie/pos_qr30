import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { _t } from "@web/core/l10n/translation";
import { useState, onWillStart, onWillDestroy } from "@odoo/owl";

export class QR30Popup extends ConfirmationDialog {
  static template = "pos_qr30_scb.QR30ConfirmationDialog";
  static props = {
    ...ConfirmationDialog.props,
    line: Object,
    order: Object,
    qrCode: String,
  };

  static defaultProps = {
    ...ConfirmationDialog.defaultProps,
    confirmLabel: _t("Manually Confirm Payment"),
    cancelLabel: _t("Cancel Payment"),
    title: _t("Mobile Banking"),
  };

  setup() {
    super.setup();
    this.props.body = _t("Please scan the QR code with %s", this.props.title);
    this.shopName = this.props.line.payment_method_id.qr30_biller_name;
    this.amount = this.env.utils.formatCurrency(this.props.line.amount);
    this.props.order.setQR30FormattedAmount(this.amount);
    this.showCustomerScreen();

    this.state = useState({
      secondBeforeExpire: 600,
    });

    this.update = setInterval(() => {
      this.countdown();
    }, 1000);

    const pmCallback = (data) => {
      console.log("Verified from qr popup");
      if (this.props.line.get_payment_status() != "done") {
        var json_data = JSON.parse(data);
        // console.log("QR POPUP json_data >>>>>>> ", json_data);
        if (
          this.props.line.qr30_ref1 == json_data.billPaymentRef1 &&
          this.props.line.qr30_ref2 == json_data.billPaymentRef2 &&
          this.props.line.qr30_ref3 == json_data.billPaymentRef3
        ) {
          this.props.line.setTransactionDetails(json_data);
          this._confirm();
        }
      }
    };

    onWillDestroy(async () => {
      clearInterval(this.update);
      this.props.order.hideQRcodeOnCustomerDisplay();
      this.props.order.chrome.sendOrderToCustomerDisplay(
        this.props.order,
        false
      );
      console.log("QR POPUP onWillDestroy");
      this.env.services.bus_service.unsubscribe("PAYMENT_CALLBACK", pmCallback);
    });

    this.env.services.bus_service.subscribe("PAYMENT_CALLBACK", pmCallback);

    this.props.order.showQRcodeOnCustomerDisplay();
  }

  countdown() {
    this.state.secondBeforeExpire = Math.round(
      this.props.line.qr30_expire_time.diffNow("seconds").seconds
    );
    if (this.state.secondBeforeExpire <= 0) {
      this.callCancelApiRequest();
      // this.props.order.hideQRcodeOnCustomerDisplay();
      this.props.close();
    }
  }

  async _cancel() {
    await this.callCancelApiRequest();
    // this.props.order.hideQRcodeOnCustomerDisplay();
    this.props.line.set_payment_status("retry");
    return super._cancel();
  }

  _confirm() {
    return super._confirm();
  }

  async callCancelApiRequest() {
    this.env.services.orm.call("pos.payment.method", "void_qr_code", []);
  }

  showCustomerScreen() {
    this.props.order.uiState["PaymentScreen"] = {
      qrPaymentData: {
        name: this.props.title,
        amount: this.amount,
        qrCode: this.props.qrCode,
      },
    };
  }

  async execButton(callback) {
    delete this.props.order.uiState.PaymentScreen.qrPaymentData;
    return super.execButton(callback);
  }
}
