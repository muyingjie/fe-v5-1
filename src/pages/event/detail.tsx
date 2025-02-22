import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/pageLayout';
import { useParams, useHistory } from 'react-router-dom';
import { RootState } from '@/store/common';
import {
  eventStoreState,
  IsRecovery,
  warningEventItem,
} from '@/store/eventInterface';
import { Form, Table, Divider, Tag } from 'antd';
import { warningStatus } from '@/store/eventInterface';
import dayjs from 'dayjs';
import { getAlertEventsById, getHistoryEventsById } from '@/services/warning';
import D3Chart from '@/components/D3Chart';
import { ChartComponentProps } from '@/store/chart';
import classNames from 'classnames';
import './index.less';
import { useTranslation } from 'react-i18next';
import { priorityColor } from '@/utils/constant';
import ColorTag from '@/components/ColorTag';
export const Detail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [options, setOptions] = useState<ChartComponentProps | null>(null);
  const [currentEdit, setCurrentEdit] = useState<warningEventItem>();
  const history = useHistory();
  const param = useParams();
  const [ishistory, setisHistory] = useState<boolean>(false);

  useEffect(() => {
    const isHistory = history.location.pathname.includes('event-history');
    setisHistory(isHistory);
    if (isHistory) {
      // 换全量告警接口
      getHistoryEventsById(id).then((res) => {
        console.log(res);
        if (res === undefined) {
          setTimeout(() => {
            history.replace('/history-events');
          }, 1000);
          return;
        }
        if (res.dat) {
          setCurrentEdit(res.dat);
          const { history_points } = res.dat;
        }
      });
    } else {
      getAlertEventsById(id).then((res) => {
        console.log(res);
        if (res === undefined) {
          setTimeout(() => {
            history.replace('/event');
          }, 1000);
          return;
        }
        if (res.dat) {
          setCurrentEdit(res.dat);
          const { history_points } = res.dat;
        }
      });
    }
  }, [id]);
  const columns = [
    {
      title: t('时间'),
      dataIndex: 't',
      render: (data) => {
        return <>{dayjs(data * 1000).format('YYYY-MM-DD HH:mm:ss')}</>;
      },
    },
    {
      title: t('值'),
      dataIndex: 'v',
    },
  ];
  return (
    <PageLayout showBack title={t('告警详情')}>
      <div className='event-detail-content'>
        <div className='event-detail-content-main'>
           
          <div>
            <span className={'event-detail-content-main-label'}>
              {t('基本信息')}：
            </span>{' '}
            {currentEdit && (
              <Tag color={priorityColor[currentEdit?.priority - 1]}>
                P{currentEdit?.priority}
              </Tag>
            )}
            <Divider type='vertical' />
            {currentEdit && (
              <>
                {dayjs(currentEdit.trigger_time * 1000 || 0).format(
                  'YYYY-MM-DD HH:mm:ss',
                )}
              </>
            )}
            <Divider type='vertical' />
            {warningStatus.Enable === currentEdit?.status
              ? t('已触发')
              : t('已屏蔽')}
            <Divider type='vertical' />
            <span
              className={classNames('event-detail-content-main-active')}
              onClick={() =>
                history.push(`/strategy/edit/${currentEdit?.rule_id}`)
              }
            >
              {currentEdit?.rule_name}

              {
                <>
                  {currentEdit && currentEdit.notify_user_objs
                    ? currentEdit.notify_user_objs.map((tag, index) => {
                        return tag ? (
                          <span key={index}>
                            <Divider type='vertical' />
                            <ColorTag text={tag.nickname}></ColorTag>
                          </span>
                        ) : null;
                      })
                    : ''}
                </>
              }
            </span>
          </div>
           
          {currentEdit?.rule_note && (
            <div>
              <span className='event-detail-content-main-label'>
                {t('备注')}：
              </span>{' '}
              {currentEdit?.rule_note}
            </div>
          )}
           <div></div> 
          {
            <div>
              <span className='event-detail-content-main-label'>
                {t('标签')}：
              </span>{' '}
              {
                <>
                  {currentEdit && currentEdit.tags
                    ? currentEdit.tags
                        .trim()
                        .split(' ')
                        .map((tag, index) => {
                          return tag ? (
                            <ColorTag text={tag} key={index}></ColorTag>
                          ) : null;
                        })
                    : ''}
                </>
              }
            </div>
          }
          {/* {
            <div>
              <span className='event-detail-content-main-label'>
                {t('资源标识')}：
              </span>{' '}
              {currentEdit?.res_ident}
            </div>
          } */}
          {currentEdit?.res_classpaths && (
            <div>
              <span className='event-detail-content-main-label'>
                {t('资源分组')}：
              </span>{' '}
              {
                <>
                  {currentEdit && currentEdit.res_classpaths
                    ? currentEdit.res_classpaths
                        .split(' ')
                        .map((tag, index) => {
                          return tag ? (
                            <ColorTag text={tag} key={index}></ColorTag>
                          ) : null;
                        })
                    : ''}
                </>
              }
            </div>
          )}
          {ishistory && currentEdit?.runbook_url !== undefined && (
            <div>
              <span className='event-detail-content-main-label'>
                {t('通知类型')}：
              </span>{' '}
              {currentEdit?.is_recovery === IsRecovery.Alert ? '告警' : '恢复'}
            </div>
          )}
          {currentEdit?.readable_expression && (
            <div>
              <span className='event-detail-content-main-label'>
                {t('表达式')}：
              </span>{' '}
              {currentEdit?.readable_expression}
            </div>
          )}
          {currentEdit?.runbook_url && (
            <div>
              <span className='event-detail-content-main-label'>
                {t('预案链接')}：
              </span>{' '}
              {currentEdit?.runbook_url}
            </div>
          )}
          {currentEdit?.history_points.map((item, i) => {
            const { metric, tags } = item;
            let options: ChartComponentProps = {
              limit: 50,
              metric,
              xplotline: currentEdit.trigger_time,
              tags: Object.keys(tags).map((key) => {
                return {
                  key,
                  value: tags[key],
                };
              }),
              range:
                // 开始时间：触发时间减去1小时；结束时间：min(触发时间+1h，当前时间)
                {
                  start: dayjs(currentEdit.trigger_time * 1000)
                    .subtract(1, 'hour')
                    .unix(),
                  end: Math.min(
                    dayjs(currentEdit.trigger_time * 1000)
                      .add(1, 'hour')
                      .unix(),
                    dayjs().unix(),
                  ),
                },
            };

            if (currentEdit.is_prome_pull) {
              options.prome_ql = currentEdit.readable_expression;
            }

            return (
              <div
                key={i}
                className='event-detail-content-main-chart-and-table'
              >
                {item.metric && (
                  <div>
                    <span
                      style={{
                        width: '60px',
                      }}
                    >
                      {t('现场值:')}
                    </span>
                    {item.metric}
                  </div>
                )}

                <Table
                  columns={columns}
                  rowKey={'t'}
                  pagination={false}
                  dataSource={item.points || []}
                ></Table>
                <D3Chart
                  title={item.metric || currentEdit.readable_expression}
                  options={options}
                ></D3Chart>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};
export default Detail;
