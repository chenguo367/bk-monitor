/*
 * Tencent is pleased to support the open source community by making BK-LOG 蓝鲸日志平台 available.
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 * BK-LOG 蓝鲸日志平台 is licensed under the MIT License.
 *
 * License for BK-LOG 蓝鲸日志平台:
 * --------------------------------------------------------------------
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
 */

import { Component as tsc } from 'vue-tsx-support';
import { Component, PropSync, Prop, Emit, Ref } from 'vue-property-decorator';
import { Select, Option, Tag, Form, FormItem, Input } from 'bk-magic-vue';
import $http from '../../api';
import { xssFilter } from '../../common/util';
import './index.scss';

interface IProps {
  propLabelList: IPropLabelList;
  selectLabelList: IPropLabelList;
}

interface IPropLabelList {
  color: string;
  name: string;
  tag_id: number;
  is_built_in?: boolean;
}

@Component
export default class QueryStatement extends tsc<IProps> {
  @PropSync('label', { type: Array }) propLabelList: Array<IPropLabelList>;
  @Prop({ type: Object, required: true }) rowData: any;
  @Prop({ type: Array, required: true }) selectLabelList: Array<IPropLabelList>;
  @Ref('checkInputForm') private readonly checkInputFormRef: Form;
  @Ref('tagSelect') private readonly tagSelectRef: Select;
  @Ref('labelEditInput') private readonly labelEditInputRef: HTMLElement;

  /** 是否展示添加标签 */
  isShowNewGroupInput = false;

  isShowAllLabel = false;

  verifyData = {
    labelEditName: ''
  };

  rules = {
    labelEditName: [
      {
        validator: this.checkTagName,
        message: window.mainComponent.$t('已有同名标签'),
        trigger: 'blur'
      },
      {
        validator: this.checkBuiltInTagName,
        message: window.mainComponent.$t('内置标签名，请重新填写'),
        trigger: 'blur'
      },
      {
        required: true,
        message: window.mainComponent.$t('必填项'),
        trigger: 'blur'
      }
    ]
  };

  get isDisabledAddNewTag() {
    return this.rowData?.status === 'terminated';
  }

  /** 过滤掉内置标签的列表 */
  get filterBuiltInList() {
    return this.selectLabelList.filter(item => !item.is_built_in);
  }

  /** 内置标签的列表 */
  get builtInList() {
    return this.selectLabelList.filter(item => item.is_built_in);
  }

  /** 索引集展示的标签 */
  get showLabelList() {
    const showIDlist = this.filterBuiltInList.map(item => item.tag_id);
    return this.propLabelList.filter(item => showIDlist.includes(item.tag_id));
  }

  get filterLabelList() {
    return this.isShowAllLabel ? this.showLabelList : this.showLabelList.slice(0, 3);
  }

  /** 单选框标签下拉列表 */
  get showGroupSelectLabelList() {
    const propIDlist = this.propLabelList.map(item => item.tag_id);
    return this.filterBuiltInList.map(item => ({
      ...item,
      disabled: propIDlist.includes(item.tag_id)
    }));
  }

  @Emit('refreshLabelList')
  initLabelSelectList() {
    return {};
  }

  checkTagName() {
    return !this.showGroupSelectLabelList.some(item => item.name === this.verifyData.labelEditName.trim());
  }

  checkBuiltInTagName() {
    return !this.builtInList.some(item => item.name === this.verifyData.labelEditName.trim());
  }

  /** 给索引集添加标签 */
  addLabelToIndexSet(tagID: number) {
    if (!tagID) return;
    $http
      .request('unionSearch/unionAddLabel', {
        params: {
          index_set_id: this.rowData.index_set_id
        },
        data: {
          tag_id: tagID
        }
      })
      .then(() => {
        const newLabel = this.selectLabelList.find(item => item.tag_id === tagID);
        this.propLabelList.push(newLabel);
        this.$bkMessage({
          theme: 'success',
          message: this.$t('操作成功')
        });
      })
      .finally(() => {});
  }

  /** 新增标签 */
  handleChangeLabelStatus(operate: string) {
    if (operate === 'add') {
      this.checkInputFormRef.validate().then(
        async () => {
          $http
            .request('unionSearch/unionCreateLabel', {
              data: {
                name: this.verifyData.labelEditName.trim()
              }
            })
            .then(res => {
              this.initLabelSelectList();
              this.addLabelToIndexSet(res.data.tag_id);
            })
            .finally(() => {
              this.verifyData.labelEditName = '';
              this.isShowNewGroupInput = false;
              this.tagSelectRef.close();
            });
        },
        () => {}
      );
    } else {
      this.isShowNewGroupInput = false;
    }
  }

  handleLabelKeyDown(val: string) {
    if (val) this.handleChangeLabelStatus('add');
  }

  /** 删除采集项的标签 */
  handleDeleteTag(tagID: number) {
    $http
      .request('unionSearch/unionDeleteLabel', {
        params: {
          index_set_id: this.rowData.index_set_id
        },
        data: {
          tag_id: tagID
        }
      })
      .then(() => {
        this.propLabelList = this.propLabelList.filter(item => item.tag_id !== tagID);
        this.$bkMessage({
          theme: 'success',
          message: this.$t('操作成功')
        });
      })
      .finally(() => {});
  }

  toggleSelect(val: boolean) {
    if (!val) {
      this.isShowNewGroupInput = false;
      this.verifyData.labelEditName = '';
    }
  }

  isShowMoreNum(index: number) {
    return index === 2 && !this.isShowAllLabel && this.showLabelList.length > 3;
  }

  render() {
    return (
      <div class='label-select'>
        <div
          class='label-tag-box'
          style={{ width: this.showLabelList.length ? '190px' : '0' }}
        >
          <span class='tag-container'>
            {this.filterLabelList.map((item, index) => {
              return (
                <span class='tag-label-item'>
                  <Tag>
                    <span class='label-tag'>
                      <span
                        v-bk-overflow-tips
                        class='title-overflow'
                      >
                        {xssFilter(item.name)}
                      </span>
                      <i
                        class='bk-icon icon-close'
                        onClick={() => this.handleDeleteTag(item.tag_id)}
                      ></i>
                    </span>
                  </Tag>
                  {this.isShowMoreNum(index) && (
                    <div
                      class='more-num'
                      v-bk-tooltips={{
                        content: `${this.showLabelList
                          .slice(3)
                          .map(item => xssFilter(item.name))
                          .join(', ')}`
                      }}
                      onClick={() => (this.isShowAllLabel = true)}
                    >
                      +{this.showLabelList.slice(3).length}
                    </div>
                  )}
                </span>
              );
            })}
          </span>
          <Select
            searchable
            popover-min-width={240}
            popover-options={{ boundary: 'window', distance: 30 }}
            disabled={this.isDisabledAddNewTag}
            onSelected={this.addLabelToIndexSet}
            onToggle={this.toggleSelect}
            ref='tagSelect'
            scopedSlots={{
              trigger: () => (
                <div
                  v-bk-tooltips={{
                    disabled: !this.isDisabledAddNewTag,
                    content: this.$t('停用状态下无法添加标签'),
                    delay: 300
                  }}
                  class={[
                    'add-label-btn',
                    {
                      disabled: this.isDisabledAddNewTag
                    }
                  ]}
                >
                  <i class='bk-icon icon-plus-line'></i>
                </div>
              )
            }}
          >
            <div
              class='new-label-container'
              slot='extension'
            >
              {this.isShowNewGroupInput ? (
                <div class='new-label-input'>
                  <Form
                    labelWidth={0}
                    style={{ width: '100%' }}
                    ref='checkInputForm'
                    {...{
                      props: {
                        model: this.verifyData,
                        rules: this.rules
                      }
                    }}
                  >
                    <FormItem property='labelEditName'>
                      <Input
                        clearable
                        ref='labelEditInput'
                        vModel={this.verifyData.labelEditName}
                        onEnter={v => this.handleLabelKeyDown(v)}
                      ></Input>
                    </FormItem>
                  </Form>
                  <div class='operate-button'>
                    <span
                      class='bk-icon icon-check-line'
                      onClick={() => this.handleChangeLabelStatus('add')}
                    ></span>
                    <span
                      class='bk-icon icon-close-line-2'
                      onClick={() => this.handleChangeLabelStatus('cancel')}
                    ></span>
                  </div>
                </div>
              ) : (
                <div
                  class='add-new-label'
                  onClick={() => {
                    this.isShowNewGroupInput = true;
                    this.$nextTick(() => {
                      this.labelEditInputRef.focus();
                    });
                  }}
                >
                  <i class='bk-icon icon-plus-circle'></i>
                  <span>{this.$t('新增标签')}</span>
                </div>
              )}
            </div>
            <div class='group-list'>
              {this.showGroupSelectLabelList.map(item => (
                <Option
                  class='label-option'
                  id={item.tag_id}
                  name={item.name}
                  disabled={item.disabled}
                ></Option>
              ))}
            </div>
          </Select>
        </div>
      </div>
    );
  }
}
