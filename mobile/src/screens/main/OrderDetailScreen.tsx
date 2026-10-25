import { useAppTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import { COLORS, formatCurrency, formatDate } from '../../utils/theme';
export default function OrderDetailScreen() {
  const s = createStyles();
  const { isDark } = useAppTheme();
  void isDark;


 const { params } = useRoute<any>(); const [order,setOrder]=useState<Order|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{ orderService.getOrder(params.orderId).then(setOrder).finally(()=>setLoading(false)); },[params.orderId]);
 if(loading)return <ActivityIndicator style={{flex:1}} color={COLORS.primary}/>;
 if(!order)return <View style={s.center}><Text>Order not found.</Text></View>;
 return <ScrollView contentContainerStyle={s.page}><Text style={s.title}>Order #{order.orderNumber}</Text><Text style={s.muted}>{formatDate(order.placedAt)} · {order.status}</Text>{order.items.map(i=><View key={i.productId} style={s.row}><Text style={s.body}>{i.quantity} × {i.productName}</Text><Text>{formatCurrency(i.subtotal)}</Text></View>)}<View style={s.row}><Text>Total</Text><Text style={s.title}>{formatCurrency(order.totalAmount)}</Text></View><Text style={s.body}>{order.shippingAddress?.line1}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}</Text></ScrollView>;
}
function createStyles() {
  const s = StyleSheet.create({page:{padding:20,gap:16},center:{flex:1,alignItems:'center',justifyContent:'center'},title:{fontSize:20,fontWeight:'700',color:COLORS.text},muted:{color:COLORS.textMuted},body:{color:COLORS.text},row:{paddingVertical:14,borderBottomWidth:1,borderColor:COLORS.border,flexDirection:'row',justifyContent:'space-between'}
  });
  return s;
}
