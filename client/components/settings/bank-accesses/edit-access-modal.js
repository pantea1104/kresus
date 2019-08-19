import React from 'react';
import { connect } from 'react-redux';

import { assert, translate as $t } from '../../../helpers';
import { actions, get } from '../../../store';

import PasswordInput from '../../ui/password-input';
import CancelAndSubmit from '../../ui/modal/cancel-and-submit-buttons';
import ModalContent from '../../ui/modal/content';
import { registerModal } from '../../ui/modal';
import ValidableInputText from '../../ui/validated-text-input';

import AccessForm from './access-form';

export const EDIT_ACCESS_MODAL_SLUG = 'edit-access';

const EditAccessModal = connect(
    state => {
        let accessId = get.modal(state, EDIT_ACCESS_MODAL_SLUG).state;
        let access = get.accessById(state, accessId);
        return {
            access,
            staticCustomFields: get.bankByUuid(state, access.vendorId).customFields || []
        };
    },

    dispatch => {
        return {
            async updateAndFetchAccess(accessId, login, password, customFields) {
                try {
                    await actions.updateAndFetchAccess(
                        dispatch,
                        accessId,
                        login,
                        password,
                        customFields
                    );
                    actions.hideModal(dispatch);
                } catch (err) {
                    // TODO properly report.
                }
            }
        };
    },

    ({ access, staticCustomFields }, { updateAndFetchAccess }) => {
        return {
            access,
            staticCustomFields,
            async handleSave(login, password, customFields) {
                await updateAndFetchAccess(access.id, login, password, customFields);
            }
        };
    }
)(
    class Content extends AccessForm {
        constructor(props) {
            super(props);

            let customFields = {};
            for (let field of this.props.access.customFields) {
                customFields[field.name] = field.value;
            }

            this.state = {
                customFields,
                login: props.access.login,
                password: ''
            };
        }

        handleSubmit = event => {
            event.preventDefault();

            assert(this.state.login.length, "validation ensures login isn't empty");
            assert(this.state.password.length, "validation ensures password isn't empty");

            let customFields = [];
            for (let { name, optional } of this.props.staticCustomFields) {
                assert(
                    this.state.customFields[name] || optional,
                    'validation should ensure all custom fields are set if required'
                );
                // Set the optional field to 'null' to delete it from the db, if it exists.
                if (optional && typeof this.state.customFields[name] === 'undefined') {
                    customFields.push({ name, value: null });
                } else {
                    customFields.push({ name, value: this.state.customFields[name] });
                }
            }

            this.props.handleSave(this.state.login, this.state.password, customFields);
        };

        render() {
            let { access, staticCustomFields } = this.props;
            let customFieldsComponents = this.renderCustomFields(
                staticCustomFields,
                access.vendorId
            );

            let body = (
                <React.Fragment>
                    <p>{$t('client.editaccessmodal.body')}</p>

                    <form id={EDIT_ACCESS_MODAL_SLUG} onSubmit={this.handleSubmit}>
                        <p className="cols-with-label">
                            <label htmlFor="login">{$t('client.settings.login')}</label>
                            <ValidableInputText
                                className="form-element-block"
                                placeholder="123456789"
                                id="login"
                                onChange={this.handleChangeLogin}
                                value={this.state.login}
                            />
                        </p>

                        <div className="cols-with-label">
                            <label htmlFor="password">{$t('client.settings.password')}</label>
                            <PasswordInput
                                id="password"
                                onChange={this.handleChangePassword}
                                className="block"
                                autoFocus={true}
                            />
                        </div>

                        {customFieldsComponents}
                    </form>
                </React.Fragment>
            );

            let footer = (
                <CancelAndSubmit
                    formId={EDIT_ACCESS_MODAL_SLUG}
                    isSubmitDisabled={this.shouldDisableSubmit(this.props.staticCustomFields)}
                />
            );

            return (
                <ModalContent
                    title={$t('client.editaccessmodal.title')}
                    body={body}
                    footer={footer}
                />
            );
        }
    }
);

registerModal(EDIT_ACCESS_MODAL_SLUG, () => <EditAccessModal />);
