import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/theme';
export default function NotificationsScreen(){return <View style={s.page}><Text style={s.title}>Notifications</Text><Text style={s.text}>Order and service updates will appear here when notifications are enabled for your account.</Text></View>}
const s=StyleSheet.create({page:{flex:1,padding:24,backgroundColor:COLORS.surface},title:{fontSize:23,fontWeight:'700',color:COLORS.text,marginBottom:12},text:{color:COLORS.textSecondary,lineHeight:22}});
