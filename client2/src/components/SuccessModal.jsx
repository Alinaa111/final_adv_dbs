import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './SuccessModal.css';


const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modal = {
  hidden: { y: "-50%", opacity: 0, scale: 0.9 },
  visible: {
    y: "0%",
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  }
};

export default function SuccessModal({
  isOpen,
  onClose,
  orderId,
  total,
  itemsCount
}) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div className="modal" variants={modal}>
            <h2>✅ Order created successfully!</h2>

            <p>🆔 Order ID: <b>#{orderId}</b></p>
            <p>💰 Total: <b>${total}</b></p>
            <p>📦 Items: <b>{itemsCount} items</b></p>
            <div className="modal-buttons">
              <button onClick={() => navigate("/profile")}>
                View my orders
              </button>
              <button className="secondary" onClick={onClose}>
                Continue shopping
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
