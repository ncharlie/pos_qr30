from odoo.tests.common import TransactionCase
from odoo.tests import tagged

from odoo.addons.pos_qr30_scb.models.pos_payment_method import PosPaymentMethod

# The CI will run these tests after all the modules are installed,
# not right after installing the one defining it.


@tagged('post_install', '-at_install')  # add `post_install` and remove `at_install`
class PostInstallTestCase(TransactionCase):

    def test_provider_compatible_when_maximum_amount_is_zero(self):
        """ Test that the maximum amount has no effect on the provider's compatibility when it is
        set to 0. """
        self.provider.maximum_amount = 0.
        currency = self.provider.main_currency_id.id

        compatible_providers = self.env['payment.provider']._get_compatible_providers(
            self.company.id, self.partner.id, self.amount, currency_id=currency
        )
        self.assertIn(self.provider, compatible_providers)

    def test_provider_compatible_when_payment_below_maximum_amount(self):
        """ Test that a provider is compatible when the payment amount is less than the maximum
        amount. """
        self.provider.maximum_amount = self.amount + 10.0
        currency = self.provider.main_currency_id.id

        compatible_providers = self.env['payment.provider']._get_compatible_providers(
            self.company.id, self.partner.id, self.amount, currency_id=currency
        )
        self.assertIn(self.provider, compatible_providers)

    def test_provider_not_compatible_when_payment_above_maximum_amount(self):
        """ Test that a provider is not compatible when the payment amount is more than the maximum
        amount. """
        self.provider.maximum_amount = self.amount - 10.0
        currency = self.provider.main_currency_id.id

        compatible_providers = self.env['payment.provider']._get_compatible_providers(
            self.company.id, self.partner.id, self.amount, currency_id=currency
        )
        self.assertNotIn(self.provider, compatible_providers)


@tagged('at_install')  # this is the default
class AtInstallTestCase(TransactionCase):
    def test_01(self):
        ...
