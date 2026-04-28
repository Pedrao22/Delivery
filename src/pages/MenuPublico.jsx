import { useParams } from 'react-router-dom';
import { OrdersProvider } from '../context/OrdersContext';
import CustomerView from '../components/customer/CustomerView';

function MenuPublicoInner() {
  const { slug } = useParams();
  return <CustomerView ridOverride={slug} />;
}

export default function MenuPublico() {
  return (
    <OrdersProvider>
      <MenuPublicoInner />
    </OrdersProvider>
  );
}
