//dobra fora sa ovom funkcijom, ako neku async f.ju wrapujemo (stavimo u ovu), ne moramo da koristimo try{..}catch(err){..} blok jer ovde hvatamo gresku i saljemo je next-u,...to za konroler funkcije npr
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
    // isto sto i: fn(req, res, next).catch(err => next(err));
  };
};
