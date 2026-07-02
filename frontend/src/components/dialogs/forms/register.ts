/**
 * Registers each per-type Main-tab form into MAIN_FORMS. Imported for its side effects by the
 * OperationDialog so the dispatch table is populated. Extended across P13-02…P13-07.
 */
import { MAIN_FORMS } from '../dialogRegistry'
import ChargeForm from './ChargeForm'
import TransferForm from './TransferForm'
import PressureTransferForm from './PressureTransferForm'
import ReactForm from './ReactForm'
import YieldReactForm from './YieldReactForm'
import CrystallizeForm from './CrystallizeForm'
import DistillForm from './DistillForm'
import FilterForm from './FilterForm'
import WashCakeForm from './WashCakeForm'
import FilterDryForm from './FilterDryForm'
import CentrifugeForm from './CentrifugeForm'
import DryForm from './DryForm'
import HeatForm from './HeatForm'
import CoolForm from './CoolForm'
import { AgeForm, ConcentrateForm, MixForm } from './SimpleTimingForms'
import ExtractForm from './ExtractForm'
import DecantForm from './DecantForm'
import FermentForm from './FermentForm'

MAIN_FORMS.Charge = ChargeForm
MAIN_FORMS.Transfer = TransferForm
MAIN_FORMS.PressureTransfer = PressureTransferForm
MAIN_FORMS.React = ReactForm
MAIN_FORMS.YieldReact = YieldReactForm
MAIN_FORMS.Crystallize = CrystallizeForm
MAIN_FORMS.Distill = DistillForm
MAIN_FORMS.Filter = FilterForm
MAIN_FORMS.WashCake = WashCakeForm
MAIN_FORMS.FilterDry = FilterDryForm
MAIN_FORMS.Centrifuge = CentrifugeForm
MAIN_FORMS.Dry = DryForm
MAIN_FORMS.Heat = HeatForm
MAIN_FORMS.Cool = CoolForm
MAIN_FORMS.Mix = MixForm
MAIN_FORMS.Age = AgeForm
MAIN_FORMS.Concentrate = ConcentrateForm
MAIN_FORMS.Extract = ExtractForm
MAIN_FORMS.Decant = DecantForm
MAIN_FORMS.Ferment = FermentForm
