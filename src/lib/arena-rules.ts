/** Shared presentation/rules. Prices and combat are always rechecked server-side. */
export const EQUIPMENT = [
 {id:'oak-blade',slot:'weapon',name:'Деревянный меч',price:100,power:4,description:'+4 к атаке'},
 {id:'steel-blade',slot:'weapon',name:'Стальной меч',price:280,power:8,description:'+8 к атаке'},
 {id:'oak-shield',slot:'shield',name:'Дубовый щит',price:100,power:3,description:'−3 входящего урона'},
 {id:'steel-shield',slot:'shield',name:'Стальной щит',price:280,power:6,description:'−6 входящего урона'},
] as const;
export type Move='attack'|'guard'|'break';
export interface Fighter {id:string;name:string;hp:number;weapon:string;shield:string;guarding:boolean}
export interface CombatState {fighters:[Fighter,Fighter];round:number;log:string[]}
export function equipmentPower(id:string){return EQUIPMENT.find(i=>i.id===id)?.power??0;}
export function resolveMove(state:CombatState,actorId:string,move:Move):CombatState {
 const next=structuredClone(state);const actor=next.fighters.find(f=>f.id===actorId);const other=next.fighters.find(f=>f.id!==actorId);
 if(!actor||!other||actor.hp<=0||other.hp<=0)throw new Error('Бой уже завершён.');
 const guard=other.guarding;actor.guarding=move==='guard';
 if(move==='guard'){actor.hp=Math.min(100,actor.hp+4);next.log.push(`${actor.name}: защита и +4 здоровья.`);}
 else {const raw=move==='break'?(guard?27:9):20;const damage=Math.max(4,raw+equipmentPower(actor.weapon)-equipmentPower(other.shield)-(guard&&move==='attack'?14:0));other.hp=Math.max(0,other.hp-damage);other.guarding=false;next.log.push(`${actor.name}: ${move==='break'?'пробитие':'атака'}, ${damage} урона.`);}
 next.round++;next.log=next.log.slice(-8);return next;
}
