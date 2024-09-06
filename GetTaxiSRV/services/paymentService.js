const stripe = require('stripe')('sk_test_51J2cDGBTir5a9QP99JLmOOujklJvSFb4ls96kfAAsLF8aZaSh9iShHdrZcycguUJm9TjFD6xcd6CePOCK5KOcpQS00PSSAuOnh');
const { parse } = require('dotenv');
const driversService = require("./drivers.service");

const updateDriverValue = async (driverId, amount) => {
  const result = await driversService.getDriverByID(driverId);
  const updatedData = {
    credits: parseFloat(result.credits) + parseFloat(amount)
  };
  console.log({updatedData, amount});
  
  await driversService.updateDriver(driverId, updatedData)
  return Promise.resolve(true);
};

exports.updateDriver = async (req, res) => {

  const driverId = req.params.driverId;
  const result = await driversService.updateDriver(driverId, updatedData)
  if (result != -1) {
    res.status(201).json({ isNotification: true, type: 'success', title: "succès", body: "les données du conducteur ont été mises à jour avec succès." });
  } else {
    res.status(201).json({ isNotification: true, type: 'error', title: "erreur", body: "La mise à jour du conducteur a échoué." });
  }
};

exports.initPayment = async (req, res) => {
  const { token, amount, driverId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert amount to cents
      currency: 'chf',
      payment_method_data: {
        type: 'card',
        card: {
          token: token, // Use the token here
        },
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Disable redirect-based payment methods
      },
    });

    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
      res.status(200).json({
        requires_action: true,
        payment_intent_client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      });
    } else if (paymentIntent.status === 'succeeded') {
      // Update driver's value
      await updateDriverValue(driverId, amount);
      res.status(200).json({ success: true, message: 'Payment successful', charge: paymentIntent });
    } else {
      res.status(200).json({ success: false, message: 'Payment failed', error: 'Payment not completed.' });
    }
  } catch (error) {
    res.status(200).json({ success: false, message: 'Payment failed', error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  const { paymentIntentId, driverId, amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update driver's value
      await updateDriverValue(driverId, amount);
      res.status(200).json({ success: true, message: 'Payment successful' });
    } else {
      res.status(500).json({ success: false, message: 'Payment failed after confirmation' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment confirmation failed', error: error.message });
  }
};